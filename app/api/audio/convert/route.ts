import { checkRateLimit } from "@/lib/rate-limit";
import { AudioProcessorService } from "@/services/audio-processor.service";
import { ApiErrorResponse, AudioBitrate } from "@/types/audio";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const convertSchema = z.object({
  videoId: z.string().trim().length(11),
  youtubeUrl: z.string().trim().min(8).max(2048),
  title: z.string().trim().min(1).max(300),
  channelTitle: z.string().trim().max(200).optional(),
  bitrate: z.union([z.literal(128), z.literal(192), z.literal(320)]),
  authorizedAudioUrl: z.string().trim().max(2048).optional(),
});

const processorService = new AudioProcessorService();

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Has alcanzado el límite de conversiones por minuto. Intenta de nuevo en ${rateLimit.resetInSeconds}s.`,
        code: "RATE_LIMITED",
      } satisfies ApiErrorResponse,
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) },
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = convertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Parámetros de conversión de YouTube a MP3 inválidos.",
          code: "INVALID_YOUTUBE_URL",
          details: parsed.error.issues.map((i) => i.message).join(", "),
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const result = await processorService.processAndPrepareMp3({
      videoId: parsed.data.videoId,
      youtubeUrl: parsed.data.youtubeUrl,
      title: parsed.data.title,
      channelTitle: parsed.data.channelTitle,
      bitrate: parsed.data.bitrate as AudioBitrate,
      authorizedAudioUrl: parsed.data.authorizedAudioUrl,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const typedError = error as Error & { code?: ApiErrorResponse["code"] };
    const code = typedError.code || "UPSTREAM_ERROR";

    return NextResponse.json(
      {
        error:
          typedError.message ||
          "No se pudo completar la conversión del video de YouTube a MP3.",
        code,
      } satisfies ApiErrorResponse,
      { status: code === "RESTRICTED_CONTENT" ? 403 : 500 }
    );
  }
}
