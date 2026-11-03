import { parseAndValidateYouTubeUrl, sanitizeFilename } from "@/lib/security";
import { ConvertYouTubeRequest, ConvertYouTubeResponse } from "@/types/audio";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { AuthorizedDownloaderService } from "./authorized-downloader.service";
import { FfmpegConverterService } from "./ffmpeg-converter.service";

/**
 * Orquestador que separa en dos etapas independientes:
 * 1) Adquisición/descarga de la fuente autorizada (`AuthorizedDownloaderService`).
 * 2) Conversión local del audio a MP3 con FFmpeg (`FfmpegConverterService`).
 */
export class AudioProcessorService {
  private readonly authorizedDownloader = new AuthorizedDownloaderService();
  private readonly ffmpegConverter = new FfmpegConverterService();

  public async processAndPrepareMp3(
    request: ConvertYouTubeRequest
  ): Promise<ConvertYouTubeResponse> {
    await this.ffmpegConverter.cleanupExpiredFiles();

    const ytValidation = parseAndValidateYouTubeUrl(request.youtubeUrl);
    if (!ytValidation.valid || ytValidation.videoId !== request.videoId) {
      const err = new Error(
        ytValidation.errorMessage || "El enlace de YouTube no es válido."
      ) as Error & { code?: string };
      err.code = "INVALID_YOUTUBE_URL";
      throw err;
    }

    const workDir = await this.ffmpegConverter.ensureOutputDir();
    const fileId = `${randomUUID()}-${request.bitrate}`;
    const inputTempPath = path.join(workDir, `input-${fileId}.tmp`);
    const outputMp3Path = path.join(workDir, `${fileId}.mp3`);

    try {
      // Etapa 1: Obtener únicamente desde una fuente de descarga autorizada
      await this.authorizedDownloader.acquireAuthorizedInput({
        videoId: request.videoId,
        directAuthorizedUrl: request.authorizedAudioUrl,
        destinationPath: inputTempPath,
      });

      // Etapa 2: Convertir a MP3 con FFmpeg local en el bitrate seleccionado (128, 192 o 320 kbps)
      const { sizeBytes } = await this.ffmpegConverter.convertFileToMp3({
        inputFilePath: inputTempPath,
        outputFilePath: outputMp3Path,
        bitrate: request.bitrate,
      });

      const safeTitle = sanitizeFilename(request.title);
      const filename = `${safeTitle}_${request.bitrate}kbps.mp3`;

      const query = new URLSearchParams({
        fileId,
        filename,
      });

      return {
        success: true,
        downloadUrl: `/api/audio/stream?${query.toString()}`,
        filename,
        bitrate: request.bitrate,
        format: "MP3",
        providerUsed: "ffmpeg-local",
        sizeBytes,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
    } finally {
      // Eliminar siempre el archivo temporal de entrada tras la conversión
      try {
        await fs.unlink(inputTempPath);
      } catch {
        // Ignorar si no llegó a crearse
      }
    }
  }
}
