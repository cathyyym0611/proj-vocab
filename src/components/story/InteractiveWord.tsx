"use client";
import { useState } from "react";

interface InteractiveWordProps {
  word: string;
  meaning: string;
}

export function InteractiveWord({ word, meaning }: InteractiveWordProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span
        onClick={() => setRevealed(!revealed)}
        className="word-highlight cursor-pointer"
      >
        {word}
      </span>
      {revealed && (
        <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded ml-0.5 whitespace-nowrap">
          {meaning}
        </span>
      )}
    </span>
  );
}
