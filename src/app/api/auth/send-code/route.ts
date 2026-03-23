import { isValidEmail, sendVerificationCode } from "@/lib/auth";
import { sendCodeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();

    if (!email) {
      return Response.json({ error: "请输入邮箱地址" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return Response.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const record = await sendVerificationCode(email);
    const result = await sendCodeEmail({ email, code: record.code });

    return Response.json({
      ok: true,
      debugCode: result.delivered ? undefined : result.debugCode,
      message: result.delivered
        ? "验证码已发送，请查收邮箱。"
        : "开发环境未配置邮件服务，验证码已输出到服务端日志。",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "验证码发送失败，请稍后重试";
    return Response.json({ error: message }, { status: 400 });
  }
}
