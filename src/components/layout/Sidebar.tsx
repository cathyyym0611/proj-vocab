"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/generate", label: "生成故事", icon: "✨" },
  { href: "/wordbook", label: "我的单词本", icon: "📖" },
  { href: "/review", label: "复习", icon: "🔄" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/auth");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-surface">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span className="text-xl font-bold text-primary">词忆</span>
          <span className="text-sm text-muted">VocabStory</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {session ? (
          <div className="rounded-xl border border-border bg-surface-hover px-3 py-3">
            <p className="text-xs text-muted">
              {session.type === "guest" ? "当前身份" : "当前账号"}
            </p>
            <p className="mt-1 text-sm font-medium">
              {session.type === "guest" ? "游客模式" : session.email}
            </p>
            <button
              onClick={handleLogout}
              className="mt-3 text-xs text-primary hover:underline"
            >
              退出登录
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="block rounded-xl border border-border px-3 py-3 text-sm font-medium text-center hover:bg-surface-hover"
          >
            登录 / 注册
          </Link>
        )}

        <p className="text-xs text-muted text-center">
          AI驱动 · 情境记忆
        </p>
      </div>
    </aside>
  );
}
