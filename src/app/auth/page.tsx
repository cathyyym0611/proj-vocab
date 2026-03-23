"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "login" | "register";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") === "register" ? "register" : "login") as AuthMode;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, login, guestLogin } = useAuth();

  const title = useMemo(
    () => (mode === "login" ? "登录你的词忆账号" : "注册词忆账号"),
    [mode]
  );

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
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
            注册邮箱账号每天可生成 10 次故事，游客每天可体验 5 次。
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-surface-hover p-1 text-sm">
          <button
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 font-medium transition-colors ${
              mode === "login" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-lg px-3 py-2 font-medium transition-colors ${
              mode === "register" ? "bg-white text-foreground shadow-sm" : "text-muted"
            }`}
          >
            注册
          </button>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "提交中..." : mode === "login" ? "登录" : "注册并开始使用"}
          </button>

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
