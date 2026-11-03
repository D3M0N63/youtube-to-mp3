import { sanitizeFilename } from "@/lib/security";
import {
  ConvertYouTubeJobParams,
  ConvertYouTubeJobResult,
  IYouTubeConversionProvider,
} from "./types";

interface CloudConvertTask {
  id: string;
  name: string;
  operation: string;
  status: "waiting" | "processing" | "finished" | "error";
  message?: string;
  result?: {
    files?: Array<{
      filename: string;
      size: number;
      url: string;
    }>;
  };
}

interface CloudConvertJobResponse {
  data: {
    id: string;
    status: "waiting" | "processing" | "finished" | "error";
    tasks: CloudConvertTask[];
  };
}

/**
 * Proveedor CloudConvert v2 para recodificar el flujo de audio autorizado de un video
 * de YouTube al bitrate exacto seleccionado (128, 192 o 320 kbps) fuera de las funciones
 * Serverless de Vercel/Netlify.
 */
export class CloudConvertAudioProvider implements IYouTubeConversionProvider {
  public readonly id = "cloudconvert-v2" as const;
  public readonly displayName = "CloudConvert Audio Engine v2";

  public isConfigured(): boolean {
    return Boolean(
      process.env.CLOUDCONVERT_API_KEY &&
        process.env.CLOUDCONVERT_API_KEY.trim().length > 10
    );
  }

  public async convertYouTubeToMp3(
    params: ConvertYouTubeJobParams
  ): Promise<ConvertYouTubeJobResult> {
    const apiKey = process.env.CLOUDCONVERT_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("CLOUDCONVERT_API_KEY no está configurada.");
    }

    if (!params.authorizedAudioUrl) {
      throw new Error(
        "Se requiere una URL de flujo de audio autorizado para recodificar con CloudConvert."
      );
    }

    const isSandbox = process.env.CLOUDCONVERT_SANDBOX === "true";
    const endpoint = isSandbox
      ? "https://sync.api.sandbox.cloudconvert.com/v2/jobs"
      : "https://sync.api.cloudconvert.com/v2/jobs";

    const safeBaseName = sanitizeFilename(params.title);
    const outputFilename = `${safeBaseName}_${params.bitrate}kbps.mp3`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "import-audio": {
            operation: "import/url",
            url: params.authorizedAudioUrl,
          },
          "convert-to-mp3": {
            operation: "convert",
            input: ["import-audio"],
            output_format: "mp3",
            audio_codec: "mp3",
            audio_bitrate: params.bitrate,
            filename: outputFilename,
          },
          "export-mp3": {
            operation: "export/url",
            input: ["convert-to-mp3"],
            inline: false,
            archive_multiple_files: false,
          },
        },
        tag: `yt-mp3-${params.videoId}`,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Error del proveedor CloudConvert (HTTP ${response.status}): ${
          errorBody || response.statusText
        }`
      );
    }

    const jobData = (await response.json()) as CloudConvertJobResponse;
    const exportTask = jobData.data?.tasks?.find(
      (t) => t.name === "export-mp3" && t.status === "finished"
    );
    const exportedFile = exportTask?.result?.files?.[0];

    if (!exportedFile?.url) {
      const failedTask = jobData.data?.tasks?.find((t) => t.status === "error");
      throw new Error(
        failedTask?.message ||
          "No se pudo obtener el archivo MP3 desde CloudConvert."
      );
    }

    return {
      downloadUrl: exportedFile.url,
      filename: outputFilename,
      bitrate: params.bitrate,
      format: "MP3",
      providerUsed: "cloudconvert-v2",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sizeBytes: exportedFile.size ?? null,
    };
  }
}
