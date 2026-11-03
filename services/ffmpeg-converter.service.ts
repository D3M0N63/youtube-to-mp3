import { AudioBitrate } from "@/types/audio";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

const TEMP_OUTPUT_DIR = path.join(os.tmpdir(), "ytmp3-converted");
const DEFAULT_TTL_SECONDS = 300; // 5 minutos

function getTempTtlMs(): number {
  const envVal = Number(process.env.TEMP_FILE_TTL_SECONDS);
  if (!Number.isNaN(envVal) && envVal >= 30) {
    return envVal * 1000;
  }
  return DEFAULT_TTL_SECONDS * 1000;
}

/**
 * Servicio dedicado exclusivamente a la conversión de audio a formato MP3
 * utilizando FFmpeg instalado localmente en el backend.
 * Está completamente separado de la lógica de descarga/adquisición de la fuente.
 */
export class FfmpegConverterService {
  public async ensureOutputDir(): Promise<string> {
    await fs.mkdir(TEMP_OUTPUT_DIR, { recursive: true });
    return TEMP_OUTPUT_DIR;
  }

  /**
   * Limpia archivos temporales expirados en el directorio de trabajo.
   */
  public async cleanupExpiredFiles(): Promise<void> {
    try {
      await this.ensureOutputDir();
      const files = await fs.readdir(TEMP_OUTPUT_DIR);
      const now = Date.now();
      const ttlMs = getTempTtlMs();

      await Promise.all(
        files.map(async (file) => {
          const fullPath = path.join(TEMP_OUTPUT_DIR, file);
          try {
            const stat = await fs.stat(fullPath);
            if (now - stat.mtimeMs > ttlMs) {
              await fs.unlink(fullPath);
            }
          } catch {
            // Ignorar si ya fue eliminado
          }
        })
      );
    } catch {
      // Ignorar errores de limpieza
    }
  }

  public scheduleFileDeletion(filePath: string): void {
    const ttlMs = getTempTtlMs();
    const timer = setTimeout(async () => {
      try {
        await fs.unlink(filePath);
      } catch {
        // Ya eliminado
      }
    }, ttlMs);

    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  /**
   * Convierte un archivo de entrada local a formato MP3 con el bitrate especificado (128, 192 o 320 kbps)
   * usando el binario local de FFmpeg (`libmp3lame`).
   */
  public async convertFileToMp3(params: {
    inputFilePath: string;
    outputFilePath: string;
    bitrate: AudioBitrate;
  }): Promise<{ sizeBytes: number }> {
    const ffmpegBin = process.env.FFMPEG_PATH?.trim() || "ffmpeg";

    await new Promise<void>((resolve, reject) => {
      const args = [
        "-y",
        "-i",
        params.inputFilePath,
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        `${params.bitrate}k`,
        "-ar",
        "44100",
        "-ac",
        "2",
        params.outputFilePath,
      ];

      const proc = spawn(ffmpegBin, args, {
        stdio: ["ignore", "ignore", "pipe"],
      });

      let stderrLog = "";
      proc.stderr.on("data", (chunk) => {
        stderrLog += chunk.toString();
      });

      proc.on("error", (err) => {
        reject(
          new Error(
            `Error al ejecutar FFmpeg local (${err.message}). Verifica que ffmpeg esté instalado en el sistema.`
          )
        );
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const summary = stderrLog.trim().split("\n").slice(-3).join(" ");
          reject(
            new Error(
              `FFmpeg no pudo convertir el archivo (código ${code}): ${
                summary || "Formato inválido."
              }`
            )
          );
        }
      });
    });

    const stat = await fs.stat(params.outputFilePath);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error("El archivo MP3 resultante está vacío.");
    }

    this.scheduleFileDeletion(params.outputFilePath);

    return { sizeBytes: stat.size };
  }

  public async resolveGeneratedFilePath(fileId: string): Promise<string | null> {
    if (!/^[a-f0-9\-]+-(128|192|320)$/i.test(fileId)) {
      return null;
    }

    const fullPath = path.join(TEMP_OUTPUT_DIR, `${fileId}.mp3`);
    try {
      const stat = await fs.stat(fullPath);
      return stat.isFile() && stat.size > 0 ? fullPath : null;
    } catch {
      return null;
    }
  }
}
