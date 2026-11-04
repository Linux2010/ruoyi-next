/**
 * Simple in-memory rate limiter.
 *
 * Limits requests per IP per window. Not for production use (use Redis),
 * but provides basic protection for self-hosted deployments.
 */

const windows = new Map<string, { count: number; reset: number }>();

const DEFAULTS = { maxRequests: 60, windowMs: 60000 }; // 60 req/min

export function rateLimit(
  key: string,
  opts: { maxRequests?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number; reset: number } {
  const maxRequests = opts.maxRequests || DEFAULTS.maxRequests;
  const windowMs = opts.windowMs || DEFAULTS.windowMs;
  const now = Date.now();

  const existing = windows.get(key);
  if (!existing || now > existing.reset) {
    windows.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  existing.count++;
  if (existing.count > maxRequests) {
    return { allowed: false, remaining: 0, reset: existing.reset };
  }

  return { allowed: true, remaining: maxRequests - existing.count, reset: existing.reset };
}

/** Clean up expired windows periodically */
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows) {
    if (now > w.reset) windows.delete(key);
  }
}, 60000).unref();