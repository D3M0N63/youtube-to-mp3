import { AudioBitrate } from "@/types/audio";

export interface ConvertYouTubeJobParams {
  videoId: string;
  youtubeUrl: string;
  title: string;
  channelTitle?: string;
  bitrate: AudioBitrate;
  authorizedAudioUrl?: string;
}

export interface ConvertYouTubeJobResult {
  downloadUrl: string;
  filename: string;
  bitrate: AudioBitrate;
  format: "MP3";
  providerUsed:
    | "authorized-youtube-api"
    | "cloudconvert-v2"
    | "authorized-archive-stream";
  expiresAt?: string;
  sizeBytes?: number | null;
  notice?: string;
}

/**
 * Interfaz desacoplada para proveedores autorizados de conversión YouTube a MP3.
 */
export interface IYouTubeConversionProvider {
  readonly id:
    | "authorized-youtube-api"
    | "cloudconvert-v2"
    | "authorized-archive-stream";
  readonly displayName: string;
  isConfigured(): boolean;
  convertYouTubeToMp3(
    params: ConvertYouTubeJobParams
  ): Promise<ConvertYouTubeJobResult>;
}
