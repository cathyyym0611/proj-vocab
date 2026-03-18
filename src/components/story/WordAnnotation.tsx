"use client";
import { useState } from "react";

interface WordAnnotationProps {
  word: string;
  meaning: string;
}

export function WordAnnotation({ word, meaning }: WordAnnotationProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="word-highlight"
      onClick={() => setShowTooltip(!showTooltip)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {word}
      <span
        className="word-tooltip"
        style={{
          opacity: showTooltip ? 1 : undefined,
          transform: showTooltip
            ? "translateX(-50%) translateY(0)"
            : undefined,
          pointerEvents: showTooltip ? "auto" : undefined,
        }}
      >
        {meaning}
      </span>
    </span>
  );
}
