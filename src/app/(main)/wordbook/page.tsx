"use client";
import { useState } from "react";
import Link from "next/link";
import { useWordbook } from "@/hooks/useWordbook";
import { STORY_STYLES } from "@/types";

export default function WordbookPage() {
  const { stories, deleteStory, toggleFavorite } = useWordbook();
  const [filter, setFilter] = useState<"all" | "favorite">("all");

  const filtered =
    filter === "favorite" ? stories.filter((s) => s.isFavorite) : stories;

  const styleLabel = (value: string) =>
    STORY_STYLES.find((s) => s.value === value)?.label || value;
  const styleEmoji = (value: string) =>
    STORY_STYLES.find((s) => s.value === value)?.emoji || "📝";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的单词本</h1>
          <p className="text-muted text-sm mt-1">
            已保存 {stories.length} 个记忆故事
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "border border-border hover:bg-surface-hover"
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter("favorite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "favorite"
                ? "bg-primary text-white"
                : "border border-border hover:bg-surface-hover"
            }`}
          >
            收藏
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-muted text-sm">
            {filter === "favorite" ? "还没有收藏的故事" : "还没有保存的故事"}
          </p>
          <Link
            href="/generate"
            className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            去生成故事
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((story) => (
            <div
              key={story.id}
              className="p-5 bg-surface border border-border rounded-2xl hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{styleEmoji(story.style)}</span>
                    <span className="text-xs text-muted">{styleLabel(story.style)}</span>
                    <span className="text-xs text-muted">
                      {new Date(story.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm mb-2 line-clamp-1">
                    {story.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {story.words.map((w) => (
                      <span
                        key={w.word}
                        className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        {w.word}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => story.id && toggleFavorite(story.id)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    title={story.isFavorite ? "取消收藏" : "收藏"}
                  >
                    {story.isFavorite ? "⭐" : "☆"}
                  </button>
                  <button
                    onClick={() => story.id && deleteStory(story.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-muted hover:text-red-500"
                    title="删除"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <Link
                href={`/wordbook/${story.id}`}
                className="block mt-3 text-xs text-primary hover:underline"
              >
                查看完整故事 →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
