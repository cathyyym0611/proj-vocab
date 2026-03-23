import {
  getCurrentSession,
  getDailyLimitForSession,
  getQuotaSubject,
} from "@/lib/auth";
import { getRemainingQuota } from "@/lib/quota";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({
        remaining: 0,
        limit: 0,
        session: null,
      });
    }

    const limit = getDailyLimitForSession(session);
    const { remaining } = await getRemainingQuota(getQuotaSubject(session), limit);

    return Response.json({ remaining, limit, session });
  } catch (error) {
    console.error("[limit] failed to fetch remaining count, using fallback:", error);
    return Response.json({ remaining: 0, limit: 0, session: null });
  }
}
