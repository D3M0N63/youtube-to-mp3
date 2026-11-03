import {
  parseAndValidateYouTubeUrl,
  validateAuthorizedAudioStreamUrl,
} from "@/lib/security";
import { ConvertYouTubeRequest, ConvertYouTubeResponse } from "@/types/audio";
import { CloudConvertAudioProvider } from "./providers/cloudconvert.provider";
import {
  AuthorizedArchiveStreamProvider,
  ExternalAuthorizedYouTubeApiProvider,
} from "./providers/native-authorized.provider";

/**
 * Servicio central de conversión de videos autorizados de YouTube a MP3.
 * No implementa mecanismos para evadir DRM o protecciones de YouTube:
 * procesa únicamente mediante API externa autorizada o flujos de audio autorizados.
 */
export class AudioProcessorService {
  private readonly externalYtApi = new ExternalAuthorizedYouTubeApiProvider();
  private readonly cloudConvert = new CloudConvertAudioProvider();
  private readonly archiveStream = new AuthorizedArchiveStreamProvider();

  public async processAndPrepareMp3(
    request: ConvertYouTubeRequest
  ): Promise<ConvertYouTubeResponse> {
    // 1. Validar que sea un enlace de YouTube genuino
    const ytValidation = parseAndValidateYouTubeUrl(request.youtubeUrl);
    if (!ytValidation.valid || ytValidation.videoId !== request.videoId) {
      const err = new Error(
        ytValidation.errorMessage || "El enlace de YouTube no es válido."
      ) as Error & { code?: string };
      err.code = "INVALID_YOUTUBE_URL";
      throw err;
    }

    // 2. Validar URL de flujo autorizado si está presente (protección anti-SSRF)
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
    }

    // 3. Prioridad 1: Proveedor externo autorizado YouTube-to-MP3 (si AUTHORIZED_YT_API_URL y AUTHORIZED_YT_API_KEY están configurados)
    if (this.externalYtApi.isConfigured()) {
      const res = await this.externalYtApi.convertYouTubeToMp3({
        videoId: request.videoId,
        youtubeUrl: ytValidation.canonicalWatchUrl!,
        title: request.title,
        channelTitle: request.channelTitle,
        bitrate: request.bitrate,
      });

      return {
        success: true,
        ...res,
      };
    }

    // 4. Prioridad 2: Si el video tiene un flujo autorizado y CloudConvert está configurado,
    //    recodificar al bitrate exacto elegido (128, 192 o 320 kbps)
    if (request.authorizedAudioUrl && this.cloudConvert.isConfigured()) {
      const res = await this.cloudConvert.convertYouTubeToMp3({
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

    // 5. Prioridad 3: Si el video cuenta con un flujo MP3 autorizado verificado,
    //    entregarlo mediante el proxy de streaming seguro con progreso real
    if (request.authorizedAudioUrl) {
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

    // 6. Si el video de YouTube no tiene flujo público autorizado y no se ha configurado
    //    la API externa autorizada, informar claramente sin simular la descarga.
    const err = new Error(
      "Este video de YouTube fue identificado correctamente, pero requiere configurar un proveedor externo autorizado (AUTHORIZED_YT_API_URL y AUTHORIZED_YT_API_KEY en las variables de entorno) para extraer y convertir su audio, ya que la aplicación no evade restricciones técnicas de YouTube. Prueba con uno de los videos de YouTube autorizados de ejemplo o configura tus credenciales en .env.local."
    ) as Error & { code?: string };
    err.code = "PROVIDER_CREDENTIALS_REQUIRED";
    throw err;
  }
}
