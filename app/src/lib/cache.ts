// Cache layer - Vercel KV (Upstash Redis) with in-memory fallback
// Cache keys per Spec §6.3 / api-spec.md §4.1

import { Redis } from "@upstash/redis";

// ===== In-memory fallback store (serverless-safe) =====
interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
  memoryStore.set(key, { value, expiresAt });
  // Prevent unbounded growth: cap at 10k entries (cheap eviction of expired)
  if (memoryStore.size > 10000) {
    const now = Date.now();
    for (const [k, v] of memoryStore) {
      if (v.expiresAt > 0 && now > v.expiresAt) memoryStore.delete(k);
    }
  }
}

function memoryDel(key: string): void {
  memoryStore.delete(key);
}

function memoryDelPrefix(prefix: string): void {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}

// ===== Redis client (lazy) =====
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

// ===== Public API =====
export async function cacheGet<T>(key: string): Promise<T | null> {
  // 1. Try Redis (KV)
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get<string>(key);
      if (raw != null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Redis failure -> fall through to memory
    }
  }
  // 2. Fallback: in-memory
  const raw = memoryGet(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const raw = JSON.stringify(value);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, raw, { ex: ttlSeconds });
      return;
    } catch {
      // Redis failure -> fall through to memory
    }
  }
  memorySet(key, raw, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
  memoryDel(key);
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      // Upstash Redis supports SCAN + DEL via pipeline; simple keys() for MVP scale
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // ignore
    }
  }
  memoryDelPrefix(prefix);
}

// ===== Cache key constants (Spec §6.3) =====
export const CACHE_TTL = {
  pluginsList: 3600, // 1h
  pluginDetail: 3600, // 1h
  score: 3600, // 1h
  security: 3600, // 1h
  trending: 3600, // 1h
  githubEtag: 7 * 24 * 3600, // 7d
  npm: 6 * 3600, // 6h
} as const;

export const cacheKeys = {
  pluginsList: "plugins:all",
  pluginDetail: (name: string) => `plugins:${name}`,
  score: (name: string) => `scores:${name}`,
  security: "security:flags",
  trending: "trending",
  githubEtag: (repo: string) => `github:etag:${repo}`,
  npm: (name: string) => `npm:${name}`,
};
