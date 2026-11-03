import { checkRateLimit } from "@/lib/rate-limit";
import { MetadataInspectorService } from "@/services/metadata-inspector.service";
import { ApiErrorResponse } from "@/types/audio";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const inspectSchema = z.object({
  url: z
    .string({ required_error: "El enlace de YouTube es obligatorio." })
    .trim()
    .min(5, "Pega un enlace de YouTube válido.")
    .max(2048, "El enlace excede la longitud máxima permitida."),
});

const inspectorService = new MetadataInspectorService();

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    const errRes: ApiErrorResponse = {
      error: `Demasiadas solicitudes. Espera ${rateLimit.resetInSeconds} segundos antes de volver a intentar.`,
      code: "RATE_LIMITED",
    };
    return NextResponse.json(errRes, {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.resetInSeconds),
      },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = inspectSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue =
        parsed.error.issues[0]?.message || "Enlace de YouTube inválido.";
      return NextResponse.json(
        {
          error: firstIssue,
          code: "INVALID_YOUTUBE_URL",
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const metadata = await inspectorService.inspectUrl(parsed.data.url);
    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (error) {
    const typedError = error as Error & { code?: ApiErrorResponse["code"] };
    const code = typedError.code || "UPSTREAM_ERROR";
    const statusMap: Record<ApiErrorResponse["code"], number> = {
      INVALID_YOUTUBE_URL: 400,
      VIDEO_NOT_FOUND: 404,
      RESTRICTED_CONTENT: 403,
      PROVIDER_CREDENTIALS_REQUIRED: 503,
      SSRF_BLOCKED: 403,
      FILE_TOO_LARGE: 413,
      RATE_LIMITED: 429,
      UPSTREAM_ERROR: 502,
    };

    return NextResponse.json(
      {
        error:
          typedError.message ||
          "No se pudo obtener la información del video de YouTube.",
        code,
      } satisfies ApiErrorResponse,
      { status: statusMap[code] || 500 }
    );
  }
}
