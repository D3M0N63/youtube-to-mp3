export type AudioBitrate = 128 | 192 | 320;

export type ProcessingStep =
  | "idle"            // Esperando enlace de YouTube
  | "inspecting"      // Validando enlace de YouTube y obteniendo metadatos
  | "ready"           // Miniatura, título y duración listos para seleccionar calidad y descargar
  | "converting"      // Procesando conversión a MP3 en la calidad seleccionada
  | "downloading"     // Transfiriendo archivo MP3 con progreso real
  | "completed"       // Archivo MP3 descargado
  | "error";          // Error de validación o de origen

export interface AudioQualityOption {
  bitrate: AudioBitrate;
  label: string;
  description: string;
  estimatedSizeBytes?: number | null;
}

export interface YouTubeVideoMetadata {
  videoId: string;
  youtubeUrl: string;
  canonicalWatchUrl: string;
  title: string;
  channelTitle: string;
  channelUrl?: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  formattedDuration: string;
  format: "MP3";
  license: string;
  metadataSource: string;
  authorizedAudioAvailable: boolean;
  authorizedAudioUrl?: string;
  authorizedAudioSizeBytes?: number | null;
  qualities: AudioQualityOption[];
}

export interface ConvertYouTubeRequest {
  videoId: string;
  youtubeUrl: string;
  title: string;
  channelTitle?: string;
  bitrate: AudioBitrate;
  authorizedAudioUrl?: string;
}

export interface ConvertYouTubeResponse {
  success: boolean;
  downloadUrl: string;
  filename: string;
  bitrate: AudioBitrate;
  format: "MP3";
  providerUsed: "authorized-archive-stream";
  sizeBytes?: number | null;
  expiresAt?: string;
  notice?: string;
}

export interface ConversionHistoryItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  formattedDuration: string;
  bitrate: AudioBitrate;
  youtubeUrl: string;
  downloadedAt: string;
}

export interface ApiErrorResponse {
  error: string;
  code:
    | "INVALID_YOUTUBE_URL"
    | "VIDEO_NOT_FOUND"
    | "RESTRICTED_CONTENT"
    | "SSRF_BLOCKED"
    | "FILE_TOO_LARGE"
    | "RATE_LIMITED"
    | "UPSTREAM_ERROR";
  details?: string;
}
