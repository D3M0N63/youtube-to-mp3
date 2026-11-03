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
  providerUsed: "authorized-archive-stream";
  expiresAt?: string;
  sizeBytes?: number | null;
  notice?: string;
}

/**
 * Interfaz para el motor de conversión de audio autorizado sin necesidad de API keys externas.
 */
export interface IYouTubeConversionProvider {
  readonly id: "authorized-archive-stream";
  readonly displayName: string;
  convertYouTubeToMp3(
    params: ConvertYouTubeJobParams
  ): Promise<ConvertYouTubeJobResult>;
}
