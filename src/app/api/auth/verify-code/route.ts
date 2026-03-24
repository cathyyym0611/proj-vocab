import {
  createSession,
  createUser,
  getUserByEmail,
  setSessionCookie,
  setTrustedLoginCookie,
  verifyEmailCode,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const code = String(body.code ?? "").trim();

    if (!email || !code) {
      return Response.json({ error: "请输入邮箱和验证码" }, { status: 400 });
    }

    await verifyEmailCode(email, code);

    const existingUser = await getUserByEmail(email);
    const user = existingUser ?? await createUser(email);

    const session = await createSession({
      type: "user",
      userId: user.id,
      email: user.email,
    });
    await setSessionCookie(session.token);
    await setTrustedLoginCookie(user.email);

    return Response.json({
      session: {
        type: "user",
        email: user.email,
        isAuthenticated: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "验证码校验失败，请稍后重试";
    return Response.json({ error: message }, { status: 400 });
  }
}
