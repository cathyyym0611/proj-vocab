"use client";
import { useState, useCallback } from "react";
import type { WordEntry, StoryStyle } from "@/types";

/**
 * If the AI failed to include a word definition table,
 * programmatically append one using the input words.
 */
function ensureWordTable(content: string, words: WordEntry[]): string {
  // Check if content already has a markdown table (|---|)
  if (/\|[\s-]+\|/.test(content)) {
    return content;
  }

  // Append a fallback table
  const tableRows = words
    .map((w) => {
      const pos = w.partOfSpeech || "-";
      const en = w.meaningEn || "-";
      const zh = (w.meaningZh && w.meaningZh !== "待查询" && w.meaningZh !== "（请参考英文释义）")
        ? w.meaningZh : "-";
      return `| ${w.word} | ${pos} | ${zh} | ${en} | - |`;
    })
    .join("\n");

  const table = `

---
### 📖 单词释义
| 单词 | 词性 | 中文释义 | 英文释义 | 音标 |
|------|------|----------|----------|------|
${tableRows}`;

  return content + table;
}

export function useStoryGeneration() {
  const [story, setStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverRemaining, setServerRemaining] = useState<number | null>(null);

  const generate = useCallback(
    async (
      words: WordEntry[],
      style: StoryStyle,
      customPrompt?: string
    ) => {
      setStory("");
      setError(null);
      setIsGenerating(true);
      setServerRemaining(null);

      let fullContent = "";

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words, style, customPrompt }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "生成失败");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.remaining !== undefined) {
                setServerRemaining(parsed.remaining);
              }
              if (parsed.text) {
                fullContent += parsed.text;
                setStory((prev) => prev + parsed.text);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // After streaming completes, ensure table exists
        const finalContent = ensureWordTable(fullContent, words);
        if (finalContent !== fullContent) {
          setStory(finalContent);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "生成失败，请重试");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStory("");
    setError(null);
  }, []);

  return { story, isGenerating, error, generate, reset, serverRemaining };
}
