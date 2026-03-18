"use client";
import { STORY_STYLES, type StoryStyle } from "@/types";

interface StyleSelectorProps {
  value: StoryStyle;
  onChange: (style: StoryStyle) => void;
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">选择故事风格</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STORY_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onChange(style.value)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
              value === style.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/30 hover:bg-surface-hover"
            }`}
          >
            <span className="text-lg">{style.emoji}</span>
            <span className="text-sm font-medium">{style.label}</span>
            <span className="text-xs text-muted line-clamp-2">
              {style.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
