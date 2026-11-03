import { parseSourceUrl } from "@/lib/security";
import { AudioBitrate } from "@/types/audio";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const TEMP_DIR = path.join(os.tmpdir(), "ytmp3-temp");
const DEFAULT_TTL_SECONDS = 300; // 5 minutos

function getTempTtlMs(): number {
  const envSec = Number(process.env.TEMP_FILE_TTL_SECONDS);
  if (!Number.isNaN(envSec) && envSec >= 30) {
    return envSec * 1000;
  }
  return DEFAULT_TTL_SECONDS * 1000;
}

export async function ensureTempDir(): Promise<string> {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  return TEMP_DIR;
}

/**
 * Elimina archivos temporales cuya antigüedad supere el tiempo de vida configurado.
 */
export async function cleanupExpiredFiles(): Promise<void> {
  try {
    await ensureTempDir();
    const entries = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    const ttlMs = getTempTtlMs();

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(TEMP_DIR, entry);
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
    // Ignorar errores de lectura de directorio temporal
  }
}

function scheduleFileDeletion(filePath: string): void {
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
 * Busca si un ID de video de YouTube posee una vía autorizada de descarga
 * (archivo autorizado en el servidor o copia abierta autorizada en Archive.org).
 */
async function resolveAuthorizedYouTubeSource(
  videoId: string
): Promise<string | null> {
  try {
    const identifier = `youtube-${videoId}`;
    const res = await fetch(
      `https://archive.org/metadata/${encodeURIComponent(identifier)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.files)) return null;

    interface ArchiveFile {
      name: string;
    }

    const files = data.files as ArchiveFile[];
    const mediaFile =
      files.find((f) => (f.name || "").toLowerCase().endsWith(".mp3")) ||
      files.find((f) => (f.name || "").toLowerCase().endsWith(".m4a")) ||
      files.find((f) => (f.name || "").toLowerCase().endsWith(".ogg")) ||
      files.find((f) => (f.name || "").toLowerCase().endsWith(".wav")) ||
      files.find((f) => (f.name || "").toLowerCase().endsWith(".mp4"));

    if (!mediaFile) return null;

    return `https://archive.org/download/${encodeURIComponent(
      identifier
    )}/${mediaFile.name
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
  } catch {
    return null;
  }
}

async function downloadToTempFile(
  sourceUrl: string,
  destPath: string
): Promise<void> {
  const response = await fetch(sourceUrl, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `No se pudo descargar el audio de origen (HTTP ${response.status}).`
    );
  }

  const nodeReadable = Readable.fromWeb(
    response.body as unknown as import("stream/web").ReadableStream
  );
  const fileStream = createWriteStream(destPath);
  await pipeline(nodeReadable, fileStream);
}

function runFfmpegToMp3(
  inputPath: string,
  outputPath: string,
  bitrate: AudioBitrate
): Promise<void> {
  const ffmpegBinary = process.env.FFMPEG_PATH?.trim() || "ffmpeg";

  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      `${bitrate}k`,
      "-ar",
      "44100",
      "-ac",
      "2",
      outputPath,
    ];

    const proc = spawn(ffmpegBinary, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderrData = "";
    proc.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(
        new Error(
          `No se pudo ejecutar FFmpeg en el servidor (${err.message}). Asegúrate de tener ffmpeg instalado.`
        )
      );
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const lastLines = stderrData.trim().split("\n").slice(-3).join(" ");
        reject(
          new Error(
            `FFmpeg finalizó con código ${code}. Detalle: ${
              lastLines || "Formato de entrada no compatible."
            }`
          )
        );
      }
    });
  });
}

export interface FfmpegConversionResult {
  fileId: string;
  filename: string;
  bitrate: AudioBitrate;
}

export async function convertAuthorizedAudioToMp3(
  rawUrl: string,
  bitrate: AudioBitrate
): Promise<FfmpegConversionResult> {
  await cleanupExpiredFiles();

  const parsed = parseSourceUrl(rawUrl);
  if (!parsed.valid || !parsed.normalizedUrl) {
    throw new Error(parsed.errorMessage || "Enlace inválido.");
  }

  let downloadSourceUrl: string;

  if (parsed.kind === "youtube") {
    const resolved = await resolveAuthorizedYouTubeSource(parsed.videoId!);
    if (!resolved) {
      throw new Error(
        "Este enlace de YouTube no dispone de una vía autorizada de descarga. Solo se procesan contenidos con descarga expresamente autorizada."
      );
    }
    downloadSourceUrl = resolved;
  } else {
    downloadSourceUrl = parsed.normalizedUrl;
  }

  const fileId = `${randomUUID()}-${bitrate}`;
  const inputTempPath = path.join(TEMP_DIR, `input-${fileId}.tmp`);
  const outputMp3Path = path.join(TEMP_DIR, `${fileId}.mp3`);

  try {
    await downloadToTempFile(downloadSourceUrl, inputTempPath);
    await runFfmpegToMp3(inputTempPath, outputMp3Path, bitrate);

    const stat = await fs.stat(outputMp3Path);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error("El archivo MP3 generado está vacío.");
    }

    scheduleFileDeletion(outputMp3Path);

    return {
      fileId,
      filename: `audio_${bitrate}kbps.mp3`,
      bitrate,
    };
  } finally {
    // Eliminar siempre el archivo temporal de entrada inmediatamente después de procesar
    try {
      await fs.unlink(inputTempPath);
    } catch {
      // Ignorar si no se creó
    }
  }
}

export async function getConvertedMp3FilePath(
  fileId: string
): Promise<string | null> {
  // Validar que fileId solo contenga caracteres seguros UUID + bitrate
  if (!/^[a-f0-9\-]+-(128|192|320)$/i.test(fileId)) {
    return null;
  }

  const fullPath = path.join(TEMP_DIR, `${fileId}.mp3`);
  try {
    const stat = await fs.stat(fullPath);
    if (stat.isFile() && stat.size > 0) {
      return fullPath;
    }
    return null;
  } catch {
    return null;
  }
}
