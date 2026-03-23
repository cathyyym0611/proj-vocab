import { getRedis } from "@/lib/redis";

const memoryMap = new Map<string, { date: string; count: number }>();

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeKey(subject: string) {
  return `quota:${subject}:${getTodayStr()}`;
}

function memGetCount(subject: string) {
  const record = memoryMap.get(subject);
  const today = getTodayStr();
  if (!record || record.date !== today) return 0;
  return record.count;
}

function memIncrement(subject: string) {
  const today = getTodayStr();
  const current = memoryMap.get(subject);
  if (!current || current.date !== today) {
    memoryMap.set(subject, { date: today, count: 1 });
    return 1;
  }
  current.count += 1;
  return current.count;
}

export async function getRemainingQuota(subject: string, limit: number) {
  const redis = await getRedis();
  const key = makeKey(subject);

  if (redis) {
    const count = (await redis.get<number>(key)) ?? 0;
    return { remaining: Math.max(0, limit - count), limit };
  }

  const count = memGetCount(subject);
  return { remaining: Math.max(0, limit - count), limit };
}

export async function consumeQuota(subject: string, limit: number) {
  const redis = await getRedis();
  const key = makeKey(subject);
  const ttl = 86400;

  if (redis) {
    const current = (await redis.get<number>(key)) ?? 0;
    if (current >= limit) {
      return { allowed: false, remaining: 0, limit };
    }
    const next = await redis.incr(key);
    if (next === 1) {
      await redis.expire(key, ttl);
    }
    return { allowed: true, remaining: Math.max(0, limit - next), limit };
  }

  const current = memGetCount(subject);
  if (current >= limit) {
    return { allowed: false, remaining: 0, limit };
  }
  const next = memIncrement(subject);
  return { allowed: true, remaining: Math.max(0, limit - next), limit };
}
