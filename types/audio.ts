export type AudioBitrate = 128 | 192 | 320;
export type AudioFormat = "MP3";

export interface ConvertRequest {
  url: string;
  format: AudioFormat;
  bitrate: AudioBitrate;
}

export interface ConvertResponse {
  success: true;
  downloadUrl: string;
  filename: string;
  bitrate: AudioBitrate;
  format: AudioFormat;
}

export interface ConvertErrorResponse {
  error: string;
}
