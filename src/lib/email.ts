import { getEnv, isProductionRuntime } from "@/lib/env";

interface SendCodeEmailInput {
  email: string;
  code: string;
}

export async function sendCodeEmail({ email, code }: SendCodeEmailInput) {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("AUTH_EMAIL_FROM");

  if (!apiKey || !from) {
    if (!isProductionRuntime()) {
      console.info(`[auth] verification code for ${email}: ${code}`);
      return { delivered: false, debugCode: code };
    }
    throw new Error("未配置邮件服务，请在 Cloudflare 中设置 RESEND_API_KEY 和 AUTH_EMAIL_FROM。");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "词忆登录验证码",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>词忆登录验证码</h2>
          <p>你的验证码是：</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
          <p>验证码 10 分钟内有效。如果这不是你的操作，请忽略此邮件。</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`验证码邮件发送失败: ${text.slice(0, 120)}`);
  }

  return { delivered: true };
}
