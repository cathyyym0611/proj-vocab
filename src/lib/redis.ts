import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = getEnv("KV_REST_API_URL") ?? getEnv("UPSTASH_REDIS_REST_URL");
  const token = getEnv("KV_REST_API_TOKEN") ?? getEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}
