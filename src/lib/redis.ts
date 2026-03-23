import { Redis } from "@upstash/redis";
import { getEnvAsync } from "@/lib/env";

let redis: Redis | null = null;

export async function getRedis(): Promise<Redis | null> {
  if (redis) return redis;

  const url = (await getEnvAsync("KV_REST_API_URL")) ?? (await getEnvAsync("UPSTASH_REDIS_REST_URL"));
  const token = (await getEnvAsync("KV_REST_API_TOKEN")) ?? (await getEnvAsync("UPSTASH_REDIS_REST_TOKEN"));

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}
