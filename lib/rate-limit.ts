import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Limpiador periódico de entradas expiradas en memoria para evitar fugas en contenedores calientes.
 */
function cleanupExpiredEntries(now: number) {
  if (rateLimitStore.size > 2000) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Controla la tasa de peticiones por IP (Sliding window / Fixed window híbrido ligero compatible con Serverless).
 */
export function checkRateLimit(
  req: NextRequest,
  customLimitPerMinute?: number
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const windowMs = 60 * 1000; // 1 minuto
  const limit =
    customLimitPerMinute ||
    Number(process.env.RATE_LIMIT_RPM) ||
    25;

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : realIp || "127.0.0.1";

  const key = `rl:${clientIp}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: 60,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetInSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
