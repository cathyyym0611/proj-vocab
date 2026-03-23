import { headers } from "next/headers";
import { client } from "@/lib/claude";
import { buildPrompt } from "@/lib/prompts";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { GenerateRequest } from "@/types";

function getClientIP(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = headersList.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

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
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "未配置 OPENAI_API_KEY。请在项目根目录 .env.local 文件中添加你的 API Key。获取地址：https://platform.openai.com/api-keys",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const headersList = await headers();
    const ip = getClientIP(headersList);

    let allowed = true;
    let remaining = 10;
    try {
      const rateLimitResult = await consumeRateLimit(ip);
      allowed = rateLimitResult.allowed;
      remaining = rateLimitResult.remaining;
    } catch (error) {
      console.error("[generate] rate limit check failed, falling back:", error);
    }

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "今日生成次数已用完，请明天再来！先去复习已有的故事吧，间隔复习效果更好哦 ✨",
          remaining: 0,
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
        Connection: "keep-alive",
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
