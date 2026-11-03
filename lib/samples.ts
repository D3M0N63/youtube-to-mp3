export interface AuthorizedYouTubeSample {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: string;
  youtubeUrl: string;
}

/**
 * Videos reales de YouTube que cuentan con espejo de audio autorizado y verificable
 * para probar el flujo completo (Inspección YouTube -> Selección 128/192/320 kbps -> Descarga MP3 real).
 */
export const AUTHORIZED_YOUTUBE_SAMPLES: AuthorizedYouTubeSample[] = [
  {
    videoId: "CnWucTOHjBY",
    title: "The Jetzons - Hard Times (Clean Instrumental)",
    channelTitle: "Lu9.2 ᑎᐱ",
    duration: "03:00",
    youtubeUrl: "https://www.youtube.com/watch?v=CnWucTOHjBY",
  },
  {
    videoId: "QcqxaoIcJlw",
    title: "Donkey Kong Country 3 - Cascade Capers [Recreated]",
    channelTitle: "Jammin' Sam Miller",
    duration: "09:48",
    youtubeUrl: "https://www.youtube.com/watch?v=QcqxaoIcJlw",
  },
  {
    videoId: "Uatt2bbs1gs",
    title: "Mahou Shoujo Madoka Magica Medley",
    channelTitle: "Escensei",
    duration: "10:14",
    youtubeUrl: "https://www.youtube.com/watch?v=Uatt2bbs1gs",
  },
];

/**
 * Convierte una duración ISO 8601 de YouTube Data API v3 (ej. "PT3M45S" o "PT1H2M10S") a segundos.
 */
export function parseYouTubeIsoDuration(isoDuration?: string): number | null {
  if (!isoDuration) return null;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

/**
 * Formatea segundos en formato MM:SS o HH:MM:SS.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (
    seconds === null ||
    seconds === undefined ||
    Number.isNaN(seconds) ||
    seconds <= 0
  ) {
    return "Disponible al convertir";
  }
  const totalSec = Math.round(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Formatea bytes en formato legible (KB, MB).
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}
