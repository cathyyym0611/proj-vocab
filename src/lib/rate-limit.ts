/**
 * Server-side IP-based daily rate limiter.
 * Uses Upstash Redis in production (Vercel), falls back to in-memory Map for local dev.
 */

import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";

const DAILY_LIMIT = 10;
const KEY_TTL_SECONDS = 86400; // 24 hours

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

function makeKey(ip: string): string {
  return `ratelimit:${ip}:${getTodayStr()}`;
}

// ── Redis client (lazy init) ──────────────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = getEnv("KV_REST_API_URL") ?? getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("KV_REST_API_TOKEN") ?? getEnv("UPSTASH_REDIS_REST_TOKEN");
  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }
  return null;
}

// ── In-memory fallback (local dev) ────────────────────────────────

interface UsageRecord {
  date: string;
  count: number;
}

const memoryMap = new Map<string, UsageRecord>();

function memGetCount(ip: string): number {
  const today = getTodayStr();
  const record = memoryMap.get(ip);
  if (!record || record.date !== today) return 0;
  return record.count;
}

function memIncrement(ip: string): number {
  const today = getTodayStr();
  let record = memoryMap.get(ip);
  if (!record || record.date !== today) {
    record = { date: today, count: 0 };
    memoryMap.set(ip, record);
  }
  record.count += 1;
  return record.count;
}

// ── Public API ────────────────────────────────────────────────────

export async function getRemainingCount(ip: string): Promise<{
  remaining: number;
  limit: number;
}> {
  const r = getRedis();
  if (r) {
    const count = (await r.get<number>(makeKey(ip))) ?? 0;
    return { remaining: Math.max(0, DAILY_LIMIT - count), limit: DAILY_LIMIT };
  }
  const count = memGetCount(ip);
  return { remaining: Math.max(0, DAILY_LIMIT - count), limit: DAILY_LIMIT };
}

export async function consumeRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const r = getRedis();

  if (r) {
    const key = makeKey(ip);
    const current = (await r.get<number>(key)) ?? 0;
    if (current >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
    }
    const newCount = await r.incr(key);
    // Set TTL only on first increment (when count becomes 1)
    if (newCount === 1) {
      await r.expire(key, KEY_TTL_SECONDS);
    }
    const remaining = Math.max(0, DAILY_LIMIT - newCount);
    return { allowed: true, remaining, limit: DAILY_LIMIT };
  }

  // In-memory fallback
  const currentCount = memGetCount(ip);
  if (currentCount >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }
  const newCount = memIncrement(ip);
  return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - newCount), limit: DAILY_LIMIT };
}
