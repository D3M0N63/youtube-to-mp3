import { formatDuration } from "@/lib/samples";
import { parseAndValidateYouTubeUrl } from "@/lib/security";
import {
  AudioBitrate,
  AudioQualityOption,
  YouTubeVideoMetadata,
} from "@/types/audio";
import { AuthorizedDownloaderService } from "./authorized-downloader.service";

function buildYouTubeQualityOptions(
  durationSeconds: number | null
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
      : null;

    return {
      bitrate: item.bitrate,
      label: item.label,
      description: item.description,
      estimatedSizeBytes,
    };
  });
}

/**
 * Inspector de enlaces de YouTube que utiliza exclusivamente el endpoint público
 * oficial YouTube oEmbed y verifica en `AuthorizedDownloaderService` si el usuario
 * cuenta con el archivo de origen autorizado. No consulta mirrors en servidores de terceros.
 */
export class MetadataInspectorService {
  private readonly authorizedDownloader = new AuthorizedDownloaderService();

  public async inspectUrl(rawUrl: string): Promise<YouTubeVideoMetadata> {
    const validation = parseAndValidateYouTubeUrl(rawUrl);
    if (
      !validation.valid ||
      !validation.videoId ||
      !validation.canonicalWatchUrl
    ) {
      const err = new Error(
        validation.errorMessage || "Enlace de YouTube inválido."
      ) as Error & { code?: string };
      err.code = "INVALID_YOUTUBE_URL";
      throw err;
    }

    const { videoId, canonicalWatchUrl } = validation;

    const [oembedData, authorizedSource] = await Promise.all([
      this.fetchYouTubeOEmbed(canonicalWatchUrl),
      this.authorizedDownloader.checkAuthorizedYouTubeSource(videoId),
    ]);

    if (!oembedData) {
      const err = new Error(
        "No se encontró el video de YouTube solicitado o el video es privado/no disponible."
      ) as Error & { code?: string };
      err.code = "VIDEO_NOT_FOUND";
      throw err;
    }

    const qualities = buildYouTubeQualityOptions(null);

    return {
      videoId,
      youtubeUrl: rawUrl.trim(),
      canonicalWatchUrl,
      title: oembedData.title,
      channelTitle: oembedData.authorName,
      channelUrl: oembedData.authorUrl,
      thumbnailUrl:
        oembedData.thumbnailUrl ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      durationSeconds: null,
      formattedDuration: formatDuration(null),
      format: "MP3",
      license: authorizedSource.available
        ? "Fuente de descarga autorizada verificada"
        : "Sin fuente de descarga autorizada registrada",
      metadataSource: "YouTube oEmbed Oficial",
      authorizedAudioAvailable: authorizedSource.available,
      qualities,
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
}
