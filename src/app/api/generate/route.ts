import {
  getCurrentSession,
  getDailyLimitForSession,
  getQuotaSubject,
} from "@/lib/auth";
import { getClient } from "@/lib/claude";
import { getEnv } from "@/lib/env";
import { buildPrompt } from "@/lib/prompts";
import { consumeQuota } from "@/lib/quota";
import type { GenerateRequest } from "@/types";

function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) return "生成失败，请重试";

  const msg = error.message;

  if (
    msg.includes("authentication") ||
    msg.includes("invalid") ||
    msg.includes("api_key") ||
    msg.includes("401") ||
    msg.includes("Incorrect API key")
  ) {
    return "API Key 无效，请检查 .env.local 中的 OPENAI_API_KEY 是否正确。可在 https://platform.openai.com/api-keys 获取。";
  }

  if (msg.includes("rate_limit") || msg.includes("429")) {
    if (msg.includes("insufficient_quota") || msg.includes("exceeded")) {
      return "OpenAI API 额度已用完，请前往 https://platform.openai.com/settings/organization/billing 充值。";
    }
    return "请求过于频繁或额度不足，请稍后再试。详情请查看 https://platform.openai.com/settings/organization/billing";
  }

  if (
    msg.includes("insufficient") ||
    msg.includes("billing") ||
    msg.includes("quota")
  ) {
    return "API 额度不足，请检查你的 OpenAI 账户余额：https://platform.openai.com/settings/organization/billing";
  }

  if (msg.includes("overloaded") || msg.includes("529") || msg.includes("503")) {
    return "服务器繁忙，请稍后再试。";
  }

  return "生成失败：" + msg.slice(0, 150);
}

export async function POST(request: Request) {
  try {
    if (!getEnv("OPENAI_API_KEY")) {
      return new Response(
        JSON.stringify({
          error:
            "未配置 OPENAI_API_KEY。本地开发请写入项目根目录 .env.local；如果部署在 Cloudflare，请在 Worker 的 Variables/Secrets 中配置该变量后重新部署。获取地址：https://platform.openai.com/api-keys",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await getCurrentSession();
    if (!session) {
      return new Response(
        JSON.stringify({
          error: "请先登录邮箱账号或选择游客登录后再生成故事。",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const dailyLimit = getDailyLimitForSession(session);
    const subject = getQuotaSubject(session);

    let allowed = true;
    let remaining = dailyLimit;
    try {
      const quotaResult = await consumeQuota(subject, dailyLimit);
      allowed = quotaResult.allowed;
      remaining = quotaResult.remaining;
    } catch (error) {
      console.error("[generate] quota check failed, falling back:", error);
    }

    if (!allowed) {
      const errorMessage =
        session.type === "guest"
          ? "游客账号今日 5 次生成机会已用完。注册邮箱账号后，每天可获得 10 次生成机会。"
          : "今日生成次数已用完，请明天再来。先去复习已有的故事吧，间隔复习效果更好哦 ✨";

      return new Response(
        JSON.stringify({
          error: errorMessage,
          remaining: 0,
          limit: dailyLimit,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "请求格式错误" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { words, style, customPrompt } = body;

    if (!words || words.length === 0) {
      return new Response(JSON.stringify({ error: "请至少提供一个单词" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { system, user } = buildPrompt(words, style, customPrompt);
    const client = getClient();

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.chat.completions.create({
            model: "gpt-4o-mini",
            stream: true,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            max_tokens: 800,
            temperature: 0.9,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ remaining })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[generate] OpenAI API error:", error);
          const message = friendlyError(error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[generate] unexpected route error:", error);
    return new Response(
      JSON.stringify({ error: friendlyError(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
