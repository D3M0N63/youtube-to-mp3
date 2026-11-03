import { getConvertedMp3FilePath } from "@/services/ffmpeg.service";
import { ConvertErrorResponse } from "@/types/audio";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;
  const filePath = await getConvertedMp3FilePath(fileId);

  if (!filePath) {
    return NextResponse.json(
      {
        error: "El archivo MP3 no existe o ha expirado.",
      } satisfies ConvertErrorResponse,
      { status: 404, headers: corsHeaders() }
    );
  }

  try {
    const stat = await fs.stat(filePath);
    const bitrateMatch = fileId.match(/-(128|192|320)$/);
    const bitrateLabel = bitrateMatch ? bitrateMatch[1] : "192";
    const filename = `audio_${bitrateLabel}kbps.mp3`;

    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "audio/mpeg",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Error al leer el archivo MP3 generado.",
      } satisfies ConvertErrorResponse,
      { status: 500, headers: corsHeaders() }
    );
  }
}
