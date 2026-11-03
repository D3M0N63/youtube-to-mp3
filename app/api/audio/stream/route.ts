import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeFilename } from "@/lib/security";
import { FfmpegConverterService } from "@/services/ffmpeg-converter.service";
import { ApiErrorResponse } from "@/types/audio";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

const ffmpegService = new FfmpegConverterService();

/**
 * Endpoint que sirve el archivo MP3 generado localmente por FFmpeg.
 */
export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 30);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Demasiadas descargas simultáneas. Espera ${rateLimit.resetInSeconds}s.`,
        code: "RATE_LIMITED",
      } satisfies ApiErrorResponse,
      { status: 429 }
    );
  }

  const fileId = req.nextUrl.searchParams.get("fileId") || "";
  const rawFilename =
    req.nextUrl.searchParams.get("filename") || "youtube_audio.mp3";

  const filePath = await ffmpegService.resolveGeneratedFilePath(fileId);
  if (!filePath) {
    return NextResponse.json(
      {
        error: "El archivo MP3 convertido no existe o ha expirado.",
        code: "VIDEO_NOT_FOUND",
      } satisfies ApiErrorResponse,
      { status: 404 }
    );
  }

  try {
    const stat = await fs.stat(filePath);
    const safeFile =
      sanitizeFilename(rawFilename.replace(/\.mp3$/i, "")) + ".mp3";

    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${safeFile}"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Error al leer el archivo MP3 generado.",
        code: "UPSTREAM_ERROR",
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
