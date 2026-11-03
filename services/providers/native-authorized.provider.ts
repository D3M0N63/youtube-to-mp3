import { sanitizeFilename } from "@/lib/security";
import {
  ConvertYouTubeJobParams,
  ConvertYouTubeJobResult,
  IYouTubeConversionProvider,
} from "./types";

/**
 * 1) Proveedor de API externa autorizada para conversión de YouTube a MP3
 *    (Configurado mediante AUTHORIZED_YT_API_URL y AUTHORIZED_YT_API_KEY).
 */
export class ExternalAuthorizedYouTubeApiProvider
  implements IYouTubeConversionProvider
{
  public readonly id = "authorized-youtube-api" as const;
  public readonly displayName = "Proveedor Externo Autorizado YouTube-to-MP3";

  public isConfigured(): boolean {
    return Boolean(
      process.env.AUTHORIZED_YT_API_URL?.trim() &&
        process.env.AUTHORIZED_YT_API_KEY?.trim()
    );
  }

  public async convertYouTubeToMp3(
    params: ConvertYouTubeJobParams
  ): Promise<ConvertYouTubeJobResult> {
    const apiUrl = process.env.AUTHORIZED_YT_API_URL?.trim();
    const apiKey = process.env.AUTHORIZED_YT_API_KEY?.trim();
    const apiHost = process.env.AUTHORIZED_YT_API_HOST?.trim();

    if (!apiUrl || !apiKey) {
      throw new Error(
        "El proveedor externo de conversión YouTube a MP3 no está configurado."
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    };

    if (apiHost) {
      headers["X-RapidAPI-Key"] = apiKey;
      headers["X-RapidAPI-Host"] = apiHost;
    }

    const urlObj = new URL(apiUrl);
    urlObj.searchParams.set("id", params.videoId);
    urlObj.searchParams.set("url", params.youtubeUrl);
    urlObj.searchParams.set("bitrate", String(params.bitrate));
    urlObj.searchParams.set("format", "mp3");

    const response = await fetch(urlObj.toString(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      throw new Error(
        `El proveedor externo respondió con estado HTTP ${response.status}.`
      );
    }

    const data = await response.json();
    const downloadLink: string | undefined =
      data.downloadUrl || data.link || data.dlink || data.url;

    if (!downloadLink) {
      throw new Error(
        data.message ||
          data.error ||
          "El proveedor externo no devolvió un enlace MP3 válido para este video."
      );
    }

    const safeTitle = sanitizeFilename(params.title);
    const filename = `${safeTitle}_${params.bitrate}kbps.mp3`;

    const streamQuery = new URLSearchParams({
      url: downloadLink,
      filename,
    });

    return {
      downloadUrl: `/api/audio/stream?${streamQuery.toString()}`,
      filename,
      bitrate: params.bitrate,
      format: "MP3",
      providerUsed: "authorized-youtube-api",
      sizeBytes: typeof data.size === "number" ? data.size : null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }
}

/**
 * 2) Proveedor de streaming para videos de YouTube con espejo de audio autorizado verificado.
 */
export class AuthorizedArchiveStreamProvider
  implements IYouTubeConversionProvider
{
  public readonly id = "authorized-archive-stream" as const;
  public readonly displayName = "Repositorio Autorizado de Audio YouTube";

  public isConfigured(): boolean {
    return true;
  }

  public async convertYouTubeToMp3(
    params: ConvertYouTubeJobParams
  ): Promise<ConvertYouTubeJobResult> {
    if (!params.authorizedAudioUrl) {
      throw new Error(
        "No se encontró un flujo de audio autorizado preexistente para este video."
      );
    }

    const safeTitle = sanitizeFilename(params.title);
    const filename = `${safeTitle}_${params.bitrate}kbps.mp3`;

    const query = new URLSearchParams({
      url: params.authorizedAudioUrl,
      filename,
    });

    return {
      downloadUrl: `/api/audio/stream?${query.toString()}`,
      filename,
      bitrate: params.bitrate,
      format: "MP3",
      providerUsed: "authorized-archive-stream",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }
}
