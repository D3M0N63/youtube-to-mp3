import { sanitizeFilename } from "@/lib/security";
import {
  ConvertYouTubeJobParams,
  ConvertYouTubeJobResult,
  IYouTubeConversionProvider,
} from "./types";

/**
 * Proveedor nativo de streaming para videos de YouTube con espejo de audio autorizado verificado.
 * No requiere API keys ni servicios comerciales externos.
 */
export class AuthorizedArchiveStreamProvider
  implements IYouTubeConversionProvider
{
  public readonly id = "authorized-archive-stream" as const;
  public readonly displayName = "Repositorio Autorizado de Audio YouTube";

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
