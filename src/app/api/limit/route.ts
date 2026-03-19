import { headers } from "next/headers";
import { getRemainingCount } from "@/lib/rate-limit";

export const runtime = "edge";

function getClientIP(headersList: Headers): string {
  // Check common proxy headers
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIP = headersList.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

export async function GET() {
  const headersList = await headers();
  const ip = getClientIP(headersList);
  const { remaining, limit } = await getRemainingCount(ip);

  return Response.json({ remaining, limit });
}
