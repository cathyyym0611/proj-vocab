"use client";
import type { WordEntry } from "@/types";

interface WordTagProps {
  word: WordEntry;
  onRemove: () => void;
}

export function WordTag({ word, onRemove }: WordTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
      <span className="font-bold">{word.word}</span>
      <span className="text-primary/60 text-xs">{word.meaningZh}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none"
        aria-label={`移除 ${word.word}`}
      >
        ×
      </button>
    </span>
  );
}
