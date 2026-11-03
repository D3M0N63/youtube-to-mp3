import { isPrivateOrReservedHost } from "@/lib/security";
import { createWriteStream } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const AUTHORIZED_MEDIA_DIR = path.join(process.cwd(), "authorized-media");
const SUPPORTED_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".m4a",
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
];

export interface AuthorizedSourceCheck {
  available: boolean;
  localFilePath?: string;
}

/**
 * Servicio dedicado exclusivamente a la obtención de fuentes de audio/video autorizadas.
 * - NO busca mirrors en Internet Archive ni en repositorios de terceros.
 * - NO elude restricciones técnicas de YouTube.
 * - Comprueba únicamente si el propietario dispone del archivo autorizado en el servidor
 *   (`authorized-media/<videoId>.*`) o si se trata de una URL directa de descarga autorizada.
 */
export class AuthorizedDownloaderService {
  /**
   * Verifica si existe un archivo de origen autorizado en el directorio local `authorized-media/`
   * correspondiente al ID del video de YouTube.
   */
  public async checkAuthorizedYouTubeSource(
    videoId: string
  ): Promise<AuthorizedSourceCheck> {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return { available: false };
    }

    try {
      await fs.mkdir(AUTHORIZED_MEDIA_DIR, { recursive: true });
      for (const ext of SUPPORTED_EXTENSIONS) {
        const candidatePath = path.join(
          AUTHORIZED_MEDIA_DIR,
          `${videoId}${ext}`
        );
        try {
          const stat = await fs.stat(candidatePath);
          if (stat.isFile() && stat.size > 0) {
            return {
              available: true,
              localFilePath: candidatePath,
            };
          }
        } catch {
          // Continuar buscando siguiente extensión
        }
      }
    } catch {
      // Directorio no accesible
    }

    return { available: false };
  }

  /**
   * Obtiene el archivo de origen autorizado y lo prepara en `destinationPath`
   * para que posteriormente el servicio de FFmpeg realice la conversión a MP3.
   */
  public async acquireAuthorizedInput(params: {
    videoId: string;
    directAuthorizedUrl?: string;
    destinationPath: string;
  }): Promise<void> {
    // 1. Verificar primero si existe el archivo autorizado local para ese videoId
    const localCheck = await this.checkAuthorizedYouTubeSource(params.videoId);
    if (localCheck.available && localCheck.localFilePath) {
      await fs.copyFile(localCheck.localFilePath, params.destinationPath);
      return;
    }

    // 2. Si se proporcionó una URL directa autorizada por el propietario, descargarla de forma segura
    if (params.directAuthorizedUrl) {
      let parsed: URL;
      try {
        parsed = new URL(params.directAuthorizedUrl);
      } catch {
        throw new Error("La URL de origen autorizada no tiene un formato válido.");
      }

      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error("Solo se admiten protocolos HTTP/HTTPS.");
      }

      if (isPrivateOrReservedHost(parsed.hostname)) {
        throw new Error("Dirección de origen bloqueada por política anti-SSRF.");
      }

      const response = await fetch(parsed.toString(), {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok || !response.body) {
        throw new Error(
          `El servidor de origen respondió con estado HTTP ${response.status}.`
        );
      }

      const nodeStream = Readable.fromWeb(
        response.body as unknown as import("stream/web").ReadableStream
      );
      const fileOut = createWriteStream(params.destinationPath);
      await pipeline(nodeStream, fileOut);
      return;
    }

    // 3. Si no hay fuente de descarga autorizada disponible
    const err = new Error(
      "Este enlace de YouTube no tiene una fuente de descarga autorizada disponible. YouTube no permite extraer flujos de audio directamente desde enlaces públicos sin autorización."
    ) as Error & { code?: string };
    err.code = "RESTRICTED_CONTENT";
    throw err;
  }
}
