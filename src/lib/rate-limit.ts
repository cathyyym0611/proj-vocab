/**
 * Server-side IP-based daily rate limiter.
 * Uses in-memory Map (resets on server restart — acceptable for beta).
 * For production, replace with Redis or database.
 */

const DAILY_LIMIT = 10;

interface UsageRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

// In-memory store keyed by IP
const usageMap = new Map<string, UsageRecord>();

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const today = getTodayStr();
  const record = usageMap.get(ip);

  if (!record || record.date !== today) {
    // New day or new IP
    return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }

  const remaining = Math.max(0, DAILY_LIMIT - record.count);
  return { allowed: remaining > 0, remaining, limit: DAILY_LIMIT };
}

export function consumeRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const today = getTodayStr();
  let record = usageMap.get(ip);

  if (!record || record.date !== today) {
    record = { date: today, count: 0 };
    usageMap.set(ip, record);
  }

  if (record.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }

  record.count += 1;
  const remaining = Math.max(0, DAILY_LIMIT - record.count);
  return { allowed: true, remaining, limit: DAILY_LIMIT };
}

export function getRemainingCount(ip: string): {
  remaining: number;
  limit: number;
} {
  const today = getTodayStr();
  const record = usageMap.get(ip);

  if (!record || record.date !== today) {
    return { remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }

  return { remaining: Math.max(0, DAILY_LIMIT - record.count), limit: DAILY_LIMIT };
}
