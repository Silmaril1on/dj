import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export function checkRateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.windowStart + windowMs,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.windowStart + windowMs,
  };
}

/**
 * Extract the real client IP from Next.js request headers.
 * Vercel sets x-real-ip; other proxies set x-forwarded-for.
 */
export function getClientIp(request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Build a 429 Too Many Requests response with standard headers.
 */
export function rateLimitResponse(resetAt) {
  const { NextResponse } = require("next/server");
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   UPSTASH REDIS (production-grade distributed rate limiting)
   Run: npm install @upstash/ratelimit @upstash/redis
   Then replace the exports above with:

   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";

   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL,
     token: process.env.UPSTASH_REDIS_REST_TOKEN,
   });

   export const authLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(10, "60 s"),
     analytics: true,
   });

   // Usage in route handler:
   // const { success, remaining, reset } = await authLimiter.limit(ip);
   // if (!success) return rateLimitResponse(reset);
───────────────────────────────────────────────────────────────────────────── */
