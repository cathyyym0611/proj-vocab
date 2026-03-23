import { getCloudflareContext } from "@opennextjs/cloudflare";

function readFromProcessEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[name];
}

function readFromCloudflareEnv(name: string): string | undefined {
  try {
    const env = getCloudflareContext().env as Record<string, unknown>;
    const value = env[name];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

export function getEnv(name: string): string | undefined {
  return readFromProcessEnv(name) ?? readFromCloudflareEnv(name);
}

async function readFromCloudflareEnvAsync(name: string): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as Record<string, unknown>)[name];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

export async function getEnvAsync(name: string): Promise<string | undefined> {
  return readFromProcessEnv(name) ?? await readFromCloudflareEnvAsync(name);
}

export function isProductionRuntime() {
  return getEnv("NODE_ENV") === "production" || process.env.NODE_ENV === "production";
}
