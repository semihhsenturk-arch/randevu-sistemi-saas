interface RateLimitContext {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per Vercel Edge/Serverless instance)
// Provides basic but effective mitigation against naive burst/DDoS attacks without needing Redis
const store = new Map<string, RateLimitContext>();

/**
 * Basic in-memory rate limiter
 * @param identifier e.g., IP address + action name
 * @param limit Max number of requests allowed within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // default 1 minute
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const context = store.get(identifier);

  // Clear if expired
  if (context && context.resetTime < now) {
    store.delete(identifier);
  }

  const activeContext = store.get(identifier) || {
    count: 0,
    resetTime: now + windowMs,
  };

  activeContext.count += 1;
  store.set(identifier, activeContext);

  // Prevent memory leaks by cleaning up occasionally if size gets too big
  if (store.size > 1000) {
    for (const [key, val] of store.entries()) {
      if (val.resetTime < now) {
        store.delete(key);
      }
    }
  }

  const success = activeContext.count <= limit;
  const remaining = Math.max(0, limit - activeContext.count);

  return {
    success,
    limit,
    remaining,
    reset: activeContext.resetTime,
  };
}

/**
 * Utility to extract client IP from NextRequest
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  
  // @ts-ignore - Some Next.js request versions might have req.ip
  return req.ip || "unknown-ip";
}
