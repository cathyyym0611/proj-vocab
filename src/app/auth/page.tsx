"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function AuthContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { sendCode, verifyCode, guestLogin } = useAuth();

  const title = useMemo(
    () => (codeSent ? "输入邮箱验证码" : "邮箱验证码登录"),
    [codeSent]
  );

  async function handleSendCode() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendCode(email);
      setCodeSent(true);
      setDevCode(result.debugCode ?? null);
      setMessage(result.message ?? "验证码已发送，请查收邮箱。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await verifyCode(email, code);
      router.push("/generate");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGuestLogin() {
    setSubmitting(true);
    setError(null);
    try {
      await guestLogin();
      router.push("/generate");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "游客登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <span className="text-xl font-bold text-primary">词忆</span>
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted">
            输入邮箱后获取验证码。首次验证会自动注册账号，之后同一邮箱可直接登录。注册账号每天可生成 10 次故事，游客每天可体验 5 次。
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          {codeSent && (
            <div className="space-y-2">
              <label className="text-sm font-medium">验证码</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="输入 6 位验证码"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
              {devCode && <span className="ml-2 font-mono">测试码: {devCode}</span>}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={codeSent ? handleVerifyCode : handleSendCode}
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "提交中..." : codeSent ? "验证并登录" : "发送验证码"}
          </button>

          {codeSent && (
            <button
              onClick={handleSendCode}
              disabled={submitting}
              className="w-full rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
            >
              重新发送验证码
            </button>
          )}

          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted">
            验证成功后：
            <span className="ml-1">新邮箱会自动注册，已注册邮箱会直接登录。</span>
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={submitting}
            className="w-full rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            游客登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthContent />
    </Suspense>
  );
}
