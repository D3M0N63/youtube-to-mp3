import {
  parseAndValidateYouTubeUrl,
  validateAuthorizedAudioStreamUrl,
} from "@/lib/security";
import { ConvertYouTubeRequest, ConvertYouTubeResponse } from "@/types/audio";
import { AuthorizedArchiveStreamProvider } from "./providers/native-authorized.provider";

/**
 * Servicio central de conversión de videos autorizados de YouTube a MP3.
 * Funciona de forma autónoma sin necesidad de API keys externas.
 */
export class AudioProcessorService {
  private readonly archiveStream = new AuthorizedArchiveStreamProvider();

  public async processAndPrepareMp3(
    request: ConvertYouTubeRequest
  ): Promise<ConvertYouTubeResponse> {
    const ytValidation = parseAndValidateYouTubeUrl(request.youtubeUrl);
    if (!ytValidation.valid || ytValidation.videoId !== request.videoId) {
      const err = new Error(
        ytValidation.errorMessage || "El enlace de YouTube no es válido."
      ) as Error & { code?: string };
      err.code = "INVALID_YOUTUBE_URL";
      throw err;
    }

    if (request.authorizedAudioUrl) {
      const streamCheck = validateAuthorizedAudioStreamUrl(
        request.authorizedAudioUrl
      );
      if (!streamCheck.valid) {
        const err = new Error(
          streamCheck.errorMessage || "URL de flujo bloqueada por seguridad."
        ) as Error & { code?: string };
        err.code = "SSRF_BLOCKED";
        throw err;
      }

      const res = await this.archiveStream.convertYouTubeToMp3({
        videoId: request.videoId,
        youtubeUrl: ytValidation.canonicalWatchUrl!,
        title: request.title,
        channelTitle: request.channelTitle,
        bitrate: request.bitrate,
        authorizedAudioUrl: request.authorizedAudioUrl,
      });

      return {
        success: true,
        ...res,
      };
    }

    const err = new Error(
      "Este video de YouTube no cuenta con una fuente de audio autorizada de libre descarga disponible."
    ) as Error & { code?: string };
    err.code = "RESTRICTED_CONTENT";
    throw err;
  }
}
