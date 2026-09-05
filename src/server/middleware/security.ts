import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap: Map<string, RateLimitEntry> = new Map();

/**
 * In-memory sliding-window rate limiter
 */
export function rateLimiter(options: { maxRequests: number; windowMs: number; prefix?: string }) {
  const { maxRequests, windowMs, prefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    let entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(key, entry);
    } else {
      entry.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down and try again later.',
          retry_after_seconds: Math.ceil((entry.resetAt - now) / 1000),
        },
      });
    }

    next();
  };
}

/**
 * Enterprise security headers middleware
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

// Clean up stale rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);
