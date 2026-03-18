"use client";
import { useState } from "react";

interface StoryActionsProps {
  content: string;
  onRegenerate: () => void;
  isGenerating: boolean;
  canRegenerate: boolean;
  regenCount: number;
  maxRegenCount: number;
}

export function StoryActions({
  content,
  onRegenerate,
  isGenerating,
  canRegenerate,
  regenCount,
  maxRegenCount,
}: StoryActionsProps) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const remaining = maxRegenCount - regenCount;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        onClick={handleCopy}
        disabled={isGenerating}
        className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
      >
        {copied ? "已复制 ✓" : "复制文本"}
      </button>
      <button
        onClick={onRegenerate}
        disabled={isGenerating || !canRegenerate}
        className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
        title={
          canRegenerate
            ? `还可重新生成 ${remaining} 次`
            : "重新生成次数已用完"
        }
      >
        {canRegenerate
          ? `重新生成 (${remaining}/${maxRegenCount})`
          : "重新生成次数已用完"}
      </button>
    </div>
  );
}
