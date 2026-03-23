import { createSession, getOrCreateGuestId, setSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const guestId = await getOrCreateGuestId();
    const session = await createSession({ type: "guest", guestId });
    await setSessionCookie(session.token);

    return Response.json({
      session: {
        type: "guest",
        email: null,
        isAuthenticated: false,
      },
    });
  } catch {
    return Response.json({ error: "游客登录失败，请稍后重试" }, { status: 500 });
  }
}
