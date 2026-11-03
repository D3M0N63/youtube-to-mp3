/**
 * Validación de URLs de YouTube y seguridad anti-SSRF para el proxy de descarga MP3.
 */

const VALID_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export interface YouTubeUrlValidationResult {
  valid: boolean;
  videoId?: string;
  canonicalWatchUrl?: string;
  errorCode?: "INVALID_YOUTUBE_URL";
  errorMessage?: string;
}

/**
 * Identifica y valida estrictamente que un enlace pertenezca a un video de YouTube
 * y extrae su identificador único de 11 caracteres.
 */
export function parseAndValidateYouTubeUrl(
  rawUrl: string
): YouTubeUrlValidationResult {
  const trimmed = rawUrl.trim();

  if (!trimmed || trimmed.length > 2048) {
    return {
      valid: false,
      errorCode: "INVALID_YOUTUBE_URL",
      errorMessage: "Por favor pega un enlace de YouTube válido.",
    };
  }

  // Permitir que el usuario pegue enlaces sin protocolo como "youtube.com/watch?v=..." o "youtu.be/..."
  const normalizedInput =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(normalizedInput);
  } catch {
    return {
      valid: false,
      errorCode: "INVALID_YOUTUBE_URL",
      errorMessage:
        "El formato del enlace no es válido. Ejemplo: https://www.youtube.com/watch?v=...",
    };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      valid: false,
      errorCode: "INVALID_YOUTUBE_URL",
      errorMessage: "El enlace debe utilizar protocolo HTTP o HTTPS.",
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!VALID_YOUTUBE_HOSTS.has(host)) {
    return {
      valid: false,
      errorCode: "INVALID_YOUTUBE_URL",
      errorMessage:
        "Este sitio trabaja exclusivamente con enlaces de videos de YouTube (youtube.com o youtu.be).",
    };
  }

  let candidateId: string | null = null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    candidateId = segments[0] || null;
  } else {
    // youtube.com/watch?v=ID
    const vParam = parsed.searchParams.get("v");
    if (vParam) {
      candidateId = vParam;
    } else {
      // youtube.com/shorts/ID, /embed/ID, /v/ID, /live/ID
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (
        segments.length >= 2 &&
        ["shorts", "embed", "v", "live"].includes(segments[0].toLowerCase())
      ) {
        candidateId = segments[1];
      }
    }
  }

  if (!candidateId || !YOUTUBE_VIDEO_ID_REGEX.test(candidateId)) {
    return {
      valid: false,
      errorCode: "INVALID_YOUTUBE_URL",
      errorMessage:
        "No se pudo identificar un ID de video de YouTube válido en el enlace proporcionado.",
    };
  }

  return {
    valid: true,
    videoId: candidateId,
    canonicalWatchUrl: `https://www.youtube.com/watch?v=${candidateId}`,
  };
}

/**
 * Verifica si un hostname o IP corresponde a una red privada, loopback o link-local (Protección SSRF).
 */
export function isPrivateOrReservedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "");

  if (
    lower === "localhost" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower === "::" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".localhost") ||
    lower === "metadata.google.internal"
  ) {
    return true;
  }

  if (
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:") ||
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.")
  ) {
    return true;
  }

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const octets = match.slice(1, 5).map((n) => parseInt(n, 10));
    if (octets.some((o) => o < 0 || o > 255)) return true;

    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
  }

  return false;
}

/**
 * Valida que una URL de flujo de audio saliente (del proveedor autorizado) sea segura contra SSRF.
 */
export function validateAuthorizedAudioStreamUrl(rawUrl: string): {
  valid: boolean;
  parsedUrl?: URL;
  errorMessage?: string;
} {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, errorMessage: "Protocolo no permitido." };
    }
    if (parsed.username || parsed.password) {
      return {
        valid: false,
        errorMessage: "No se permiten credenciales en la URL de flujo.",
      };
    }
    if (isPrivateOrReservedHost(parsed.hostname)) {
      return {
        valid: false,
        errorMessage: "Bloqueado por protección anti-SSRF.",
      };
    }
    return { valid: true, parsedUrl: parsed };
  } catch {
    return { valid: false, errorMessage: "URL de flujo de audio inválida." };
  }
}

/**
 * Obtiene el límite máximo de tamaño de archivo permitido en bytes (por defecto 150 MB).
 */
export function getMaxAudioSizeBytes(): number {
  const envVal = Number(process.env.MAX_AUDIO_SIZE_BYTES);
  if (!Number.isNaN(envVal) && envVal > 0) {
    return envVal;
  }
  return 150 * 1024 * 1024;
}

/**
 * Sanitiza un nombre de archivo para evitar caracteres inválidos en descargas MP3.
 */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-\s.]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return cleaned.slice(0, 110) || "youtube_audio";
}
