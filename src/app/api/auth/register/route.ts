import { createSession, createUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return Response.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "密码至少需要 6 位" }, { status: 400 });
    }

    const user = await createUser(email, password);
    const session = await createSession({
      type: "user",
      userId: user.id,
      email: user.email,
    });
    await setSessionCookie(session.token);

    return Response.json({
      session: {
        type: "user",
        email: user.email,
        isAuthenticated: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败，请稍后重试";
    return Response.json({ error: message }, { status: 400 });
  }
}
