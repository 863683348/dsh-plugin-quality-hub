// Simple rate limiter - sliding window per key
// Public endpoints: 60 req/min per IP (ADR-008)
// Uses in-memory Map locally; Vercel KV would be used in production (upstash ratelimit)

import { ApiError } from "@/lib/errors";

interface WindowEntry {
  timestamps: number[];
}

const windows = new Map<string, WindowEntry>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

function pruneWindow(key: string, now: number): void {
  const entry = windows.get(key);
  if (!entry) return;
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_MS);
  if (entry.timestamps.length === 0) {
    windows.delete(key);
  } else {
    windows.set(key, entry);
  }
}

/**
 * Check rate limit for a key. Throws ApiError 4290 when exceeded.
 * NOTE: single-instance only. For multi-region Vercel deploys, replace with
 * @upstash/ratelimit backed by Vercel KV (see api-spec §4.2).
 */
export async function rateLimit(key: string, limit = MAX_REQUESTS): Promise<void> {
  const now = Date.now();
  pruneWindow(key, now);

  const entry = windows.get(key) ?? { timestamps: [] };
  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfter = new Date(oldest + WINDOW_MS);
    throw ApiError.rateLimited(
      `Rate limit exceeded, retry after ${retryAfter.toISOString()}`
    );
  }
  entry.timestamps.push(now);
  windows.set(key, entry);
}
