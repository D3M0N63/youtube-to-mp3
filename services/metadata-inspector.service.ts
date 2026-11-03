import { formatDuration, parseYouTubeIsoDuration } from "@/lib/samples";
import { parseAndValidateYouTubeUrl } from "@/lib/security";
import {
  AudioBitrate,
  AudioQualityOption,
  YouTubeVideoMetadata,
} from "@/types/audio";
import { CloudConvertAudioProvider } from "./providers/cloudconvert.provider";
import { ExternalAuthorizedYouTubeApiProvider } from "./providers/native-authorized.provider";

function buildYouTubeQualityOptions(
  durationSeconds: number | null,
  baseSizeBytes?: number | null
): AudioQualityOption[] {
  const bitrates: Array<{
    bitrate: AudioBitrate;
    label: string;
    description: string;
  }> = [
    {
      bitrate: 128,
      label: "128 kbps",
      description: "Calidad estándar · Ligero",
    },
    {
      bitrate: 192,
      label: "192 kbps",
      description: "Alta calidad · Balance ideal",
    },
    {
      bitrate: 320,
      label: "320 kbps",
      description: "Máxima fidelidad · Estudio",
    },
  ];

  return bitrates.map((item) => {
    const estimatedSizeBytes = durationSeconds
      ? Math.round(((item.bitrate * 1000) / 8) * durationSeconds)
      : baseSizeBytes || null;

    return {
      bitrate: item.bitrate,
      label: item.label,
      description: item.description,
      estimatedSizeBytes,
    };
  });
}

export class MetadataInspectorService {
  private externalYtProvider = new ExternalAuthorizedYouTubeApiProvider();
  private cloudConvertProvider = new CloudConvertAudioProvider();

  public async inspectUrl(rawUrl: string): Promise<YouTubeVideoMetadata> {
    const validation = parseAndValidateYouTubeUrl(rawUrl);
    if (!validation.valid || !validation.videoId || !validation.canonicalWatchUrl) {
      const err = new Error(
        validation.errorMessage || "Enlace de YouTube inválido."
      ) as Error & { code?: string };
      err.code = "INVALID_YOUTUBE_URL";
      throw err;
    }

    const { videoId, canonicalWatchUrl } = validation;

    // 1. Consultar en paralelo:
    //    a) YouTube Official oEmbed API (pública, sin clave requerida)
    //    b) YouTube Data API v3 (si YOUTUBE_DATA_API_KEY está configurada, para duración ISO y licencia)
    //    c) Repositorio de preservación autorizada (archive.org/metadata/youtube-{videoId})
    const [oembedData, dataApiResult, archiveMirror] = await Promise.all([
      this.fetchYouTubeOEmbed(canonicalWatchUrl),
      this.fetchYouTubeDataApiV3(videoId),
      this.fetchAuthorizedArchiveMirror(videoId),
    ]);

    if (!oembedData && !dataApiResult && !archiveMirror) {
      const err = new Error(
        "No se encontró el video de YouTube solicitado o el video es privado/no disponible."
      ) as Error & { code?: string };
      err.code = "VIDEO_NOT_FOUND";
      throw err;
    }

    const title =
      dataApiResult?.title ||
      oembedData?.title ||
      archiveMirror?.title ||
      `YouTube Video (${videoId})`;

    const channelTitle =
      dataApiResult?.channelTitle ||
      oembedData?.authorName ||
      archiveMirror?.creator ||
      "Canal de YouTube";

    const thumbnailUrl =
      dataApiResult?.thumbnailUrl ||
      oembedData?.thumbnailUrl ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const durationSeconds =
      dataApiResult?.durationSeconds ?? archiveMirror?.durationSeconds ?? null;

    const license =
      dataApiResult?.license === "creativeCommon"
        ? "Creative Commons (CC BY - YouTube)"
        : archiveMirror
        ? "Contenido con Espejo de Audio Autorizado"
        : "Contenido de YouTube (Uso bajo autorización)";

    const metadataSource = dataApiResult
      ? "YouTube Data API v3 Oficial"
      : archiveMirror
      ? "YouTube oEmbed Oficial + Repositorio Autorizado"
      : "YouTube oEmbed API Oficial";

    const externalApiConfigured = this.externalYtProvider.isConfigured();
    const cloudConvertConfigured = this.cloudConvertProvider.isConfigured();
    const authorizedAudioAvailable =
      Boolean(archiveMirror?.mp3Url) || externalApiConfigured;

    const qualities = buildYouTubeQualityOptions(
      durationSeconds,
      archiveMirror?.sizeBytes
    );

    return {
      videoId,
      youtubeUrl: rawUrl.trim(),
      canonicalWatchUrl,
      title,
      channelTitle,
      channelUrl: oembedData?.authorUrl,
      thumbnailUrl,
      durationSeconds,
      formattedDuration: formatDuration(durationSeconds),
      format: "MP3",
      license,
      metadataSource,
      authorizedAudioAvailable,
      authorizedAudioUrl: archiveMirror?.mp3Url,
      authorizedAudioSizeBytes: archiveMirror?.sizeBytes ?? null,
      qualities,
      externalApiConfigured,
      cloudConvertConfigured,
    };
  }

  private async fetchYouTubeOEmbed(canonicalWatchUrl: string): Promise<{
    title: string;
    authorName: string;
    authorUrl?: string;
    thumbnailUrl: string;
  } | null> {
    try {
      const oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        canonicalWatchUrl
      )}&format=json`;
      const res = await fetch(oembedEndpoint, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return {
        title: String(data.title || ""),
        authorName: String(data.author_name || "Canal de YouTube"),
        authorUrl: data.author_url ? String(data.author_url) : undefined,
        thumbnailUrl: String(data.thumbnail_url || ""),
      };
    } catch {
      return null;
    }
  }

  private async fetchYouTubeDataApiV3(videoId: string): Promise<{
    title: string;
    channelTitle: string;
    thumbnailUrl?: string;
    durationSeconds: number | null;
    license?: string;
  } | null> {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim();
    if (!apiKey) return null;

    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(
        videoId
      )}&key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;

      const data = await res.json();
      const item = data?.items?.[0];
      if (!item) return null;

      const snippet = item.snippet || {};
      const contentDetails = item.contentDetails || {};
      const status = item.status || {};
      const thumbs = snippet.thumbnails || {};
      const bestThumb =
        thumbs.maxres?.url ||
        thumbs.standard?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url;

      return {
        title: String(snippet.title || ""),
        channelTitle: String(snippet.channelTitle || ""),
        thumbnailUrl: bestThumb,
        durationSeconds: parseYouTubeIsoDuration(contentDetails.duration),
        license: status.license,
      };
    } catch {
      return null;
    }
  }

  private async fetchAuthorizedArchiveMirror(videoId: string): Promise<{
    title?: string;
    creator?: string;
    mp3Url: string;
    durationSeconds: number | null;
    sizeBytes: number | null;
  } | null> {
    try {
      const identifier = `youtube-${videoId}`;
      const res = await fetch(
        `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !Array.isArray(data.files)) return null;

      interface ArchiveFile {
        name: string;
        format?: string;
        size?: string | number;
        length?: string | number;
      }

      const files = data.files as ArchiveFile[];
      const mp3File =
        files.find(
          (f) =>
            (f.name || "").toLowerCase().endsWith(".mp3") &&
            (f.format || "").toLowerCase().includes("vbr")
        ) ||
        files.find((f) => (f.name || "").toLowerCase().endsWith(".mp3"));

      if (!mp3File) return null;

      const mp3Url = `https://archive.org/download/${encodeURIComponent(
        identifier
      )}/${mp3File.name
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/")}`;

      const rawLen = mp3File.length ? parseFloat(String(mp3File.length)) : NaN;
      const durationSeconds = !Number.isNaN(rawLen) && rawLen > 0 ? rawLen : null;
      const sizeBytes = mp3File.size ? Number(mp3File.size) : null;

      return {
        title: data.metadata?.title
          ? String(data.metadata.title)
          : undefined,
        creator: data.metadata?.creator
          ? String(data.metadata.creator)
          : undefined,
        mp3Url,
        durationSeconds,
        sizeBytes,
      };
    } catch {
      return null;
    }
  }
}
