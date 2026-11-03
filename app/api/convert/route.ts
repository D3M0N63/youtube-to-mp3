import { checkRateLimit } from "@/lib/rate-limit";
import { convertAuthorizedAudioToMp3 } from "@/services/ffmpeg.service";
import {
  AudioBitrate,
  ConvertErrorResponse,
  ConvertResponse,
} from "@/types/audio";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const convertRequestSchema = z.object({
  url: z.string().trim().min(5, "Pega un enlace válido.").max(2048),
  format: z.literal("MP3").default("MP3"),
  bitrate: z.union([z.literal(128), z.literal(192), z.literal(320)]),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Demasiadas solicitudes. Intenta de nuevo en ${rateLimit.resetInSeconds}s.`,
      } satisfies ConvertErrorResponse,
      { status: 429, headers: corsHeaders() }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = convertRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Parámetros de conversión inválidos.",
        } satisfies ConvertErrorResponse,
        { status: 400, headers: corsHeaders() }
      );
    }

    const result = await convertAuthorizedAudioToMp3(
      parsed.data.url,
      parsed.data.bitrate as AudioBitrate
    );

    const response: ConvertResponse = {
      success: true,
      downloadUrl: `/api/download/${result.fileId}`,
      filename: result.filename,
      bitrate: result.bitrate,
      format: "MP3",
    };

    return NextResponse.json(response, {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al procesar el audio con FFmpeg.",
      } satisfies ConvertErrorResponse,
      { status: 422, headers: corsHeaders() }
    );
  }
}
