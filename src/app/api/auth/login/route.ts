import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return Response.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return Response.json({ error: "邮箱或密码不正确" }, { status: 401 });
    }

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
  } catch {
    return Response.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}
