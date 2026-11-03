const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export interface ParsedSourceUrl {
  valid: boolean;
  kind?: "youtube" | "direct_media";
  videoId?: string;
  normalizedUrl?: string;
  errorMessage?: string;
}

export function isPrivateOrReservedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "");

  if (
    lower === "localhost" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower === "::" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
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
    if (a >= 224) return true;
  }

  return false;
}

export function parseSourceUrl(rawUrl: string): ParsedSourceUrl {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) {
    return {
      valid: false,
      errorMessage: "Ingresa un enlace válido.",
    };
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      valid: false,
      errorMessage: "El formato del enlace no es válido.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      errorMessage: "Solo se admiten enlaces HTTP o HTTPS.",
    };
  }

  if (isPrivateOrReservedHost(parsed.hostname)) {
    return {
      valid: false,
      errorMessage: "Dirección bloqueada por seguridad (SSRF).",
    };
  }

  const host = parsed.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.has(host)) {
    let candidateId: string | null = null;
    if (host === "youtu.be" || host === "www.youtu.be") {
      candidateId = parsed.pathname.split("/").filter(Boolean)[0] || null;
    } else {
      candidateId = parsed.searchParams.get("v");
      if (!candidateId) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (
          parts.length >= 2 &&
          ["shorts", "embed", "v", "live"].includes(parts[0].toLowerCase())
        ) {
          candidateId = parts[1];
        }
      }
    }

    if (!candidateId || !YOUTUBE_VIDEO_ID_REGEX.test(candidateId)) {
      return {
        valid: false,
        errorMessage: "El enlace de YouTube no contiene un ID de video válido.",
      };
    }

    return {
      valid: true,
      kind: "youtube",
      videoId: candidateId,
      normalizedUrl: `https://www.youtube.com/watch?v=${candidateId}`,
    };
  }

  return {
    valid: true,
    kind: "direct_media",
    normalizedUrl: parsed.toString(),
  };
}
