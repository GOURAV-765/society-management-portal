import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitInfo>(); // Map of IP -> request timestamps // Map of IP -> request timestamps

// Periodic cleanup to prevent memory leak – remove entries with empty timestamps
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  for (const [ip, info] of ipRequestMap.entries()) {
    // Remove timestamps older than window
    const now = Date.now();
    info.timestamps = info.timestamps.filter(ts => now - ts < WINDOW_SIZE_MS);
    if (info.timestamps.length === 0) {
      ipRequestMap.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Optional hard cap on map size to avoid unbounded growth
const MAX_IP_ENTRIES = 10000;
if (ipRequestMap.size > MAX_IP_ENTRIES) {
  // Delete oldest entries (simple strategy: delete random few)
  const keys = Array.from(ipRequestMap.keys()).slice(0, ipRequestMap.size - MAX_IP_ENTRIES);
  for (const k of keys) ipRequestMap.delete(k);
}


const WINDOW_SIZE_MS = 60 * 1000; // 1 minute window

// Duplicate cleanup block removed – original logic retained earlier.
const MAX_REQUESTS = 100; // Max 100 requests per minute

/**
 * Sliding Window In-Memory Rate Limiter middleware.
 * Zero-dependency alternative to express-rate-limit + Redis for local development.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-ip';
  const now = Date.now();

  let clientData = ipRequestMap.get(ip);

  if (!clientData) {
    clientData = { timestamps: [] };
    ipRequestMap.set(ip, clientData);
  }

  // Filter out timestamps older than the window size
  clientData.timestamps = clientData.timestamps.filter(
    (timestamp) => now - timestamp < WINDOW_SIZE_MS
  );

  if (clientData.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after a minute.',
    });
    return;
  }

  // Add the current request timestamp
  clientData.timestamps.push(now);
  next();
};
