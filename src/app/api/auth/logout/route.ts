import { clearCurrentSession } from "@/lib/auth";

export async function POST() {
  await clearCurrentSession();
  return Response.json({ ok: true });
}
