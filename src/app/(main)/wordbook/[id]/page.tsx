"use client";

export const runtime = "edge";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { StoryDisplay } from "@/components/story/StoryDisplay";
import { STORY_STYLES } from "@/types";
import type { Story } from "@/types";

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.stories
      .get(Number(id))
      .then((s) => {
        setStory(s || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface rounded w-1/3" />
        <div className="h-64 bg-surface rounded-2xl" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">故事不存在</p>
        <Link href="/wordbook" className="text-primary text-sm hover:underline mt-2 inline-block">
          返回单词本
        </Link>
      </div>
    );
  }

  const styleInfo = STORY_STYLES.find((s) => s.value === story.style);

  return (
    <div className="space-y-6">
      <Link
        href="/wordbook"
        className="text-sm text-muted hover:text-primary transition-colors"
      >
        ← 返回单词本
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span>{styleInfo?.emoji || "📝"}</span>
          <span className="text-sm text-muted">{styleInfo?.label || story.style}</span>
          <span className="text-sm text-muted">·</span>
          <span className="text-sm text-muted">
            {new Date(story.createdAt).toLocaleDateString("zh-CN")}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{story.title}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {story.words.map((w) => (
          <span
            key={w.word}
            className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
          >
            {w.word}
          </span>
        ))}
      </div>

      <StoryDisplay content={story.content} isStreaming={false} />
    </div>
  );
}
