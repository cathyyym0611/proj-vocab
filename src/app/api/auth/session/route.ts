import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  return Response.json({ session });
}
