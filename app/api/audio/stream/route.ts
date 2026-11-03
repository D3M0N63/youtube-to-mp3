import { checkRateLimit } from "@/lib/rate-limit";
import {
  getMaxAudioSizeBytes,
  sanitizeFilename,
  validateAuthorizedAudioStreamUrl,
} from "@/lib/security";
import { ApiErrorResponse } from "@/types/audio";
import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint de streaming seguro para entregar el archivo MP3 convertido
 * sin almacenar copias permanentes en el servidor (compatible con Vercel y Netlify).
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

  const targetUrl = req.nextUrl.searchParams.get("url") || "";
  const rawFilename =
    req.nextUrl.searchParams.get("filename") || "youtube_audio.mp3";

  const validation = validateAuthorizedAudioStreamUrl(targetUrl);
  if (!validation.valid || !validation.parsedUrl) {
    return NextResponse.json(
      {
        error:
          validation.errorMessage || "URL de descarga bloqueada por seguridad.",
        code: "SSRF_BLOCKED",
      } satisfies ApiErrorResponse,
      { status: 403 }
    );
  }

  try {
    const upstreamResponse = await fetch(validation.parsedUrl.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "YouTubeToMp3Studio/1.0 (Authorized Audio Streamer)",
      },
      signal: AbortSignal.timeout(55000),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return NextResponse.json(
        {
          error: `El servidor de audio respondió con estado HTTP ${upstreamResponse.status}.`,
          code: "UPSTREAM_ERROR",
        } satisfies ApiErrorResponse,
        { status: 502 }
      );
    }

    const contentLength = upstreamResponse.headers.get("content-length");
    const maxBytes = getMaxAudioSizeBytes();

    if (contentLength && Number(contentLength) > maxBytes) {
      return NextResponse.json(
        {
          error: `El archivo MP3 excede el tamaño máximo permitido (${Math.round(
            maxBytes / (1024 * 1024)
          )} MB).`,
          code: "FILE_TOO_LARGE",
        } satisfies ApiErrorResponse,
        { status: 413 }
      );
    }

    const safeFile =
      sanitizeFilename(rawFilename.replace(/\.mp3$/i, "")) + ".mp3";

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "audio/mpeg");
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${safeFile}"`
    );
    responseHeaders.set("Cache-Control", "no-store, max-age=0");
    responseHeaders.set("X-Content-Type-Options", "nosniff");

    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new NextResponse(upstreamResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Error durante la descarga del archivo MP3: ${error.message}`
            : "Error inesperado descargando el archivo MP3.",
        code: "UPSTREAM_ERROR",
      } satisfies ApiErrorResponse,
      { status: 502 }
    );
  }
}
