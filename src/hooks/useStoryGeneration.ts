"use client";
import { useState, useCallback } from "react";
import type { WordEntry, StoryStyle } from "@/types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeStoryAnnotations(content: string, words: WordEntry[]): string {
  let normalized = content;

  for (const { word, meaningZh } of words) {
    const escapedWord = escapeRegExp(word);
    const fallbackMeaning =
      meaningZh && meaningZh !== "待查询" && meaningZh !== "（请参考英文释义）"
        ? meaningZh
        : "";

    const pairedPatterns = [
      new RegExp(`[（(\\[【]${escapedWord}[）)\\]】]\\s*[【\\[]([^\\]】]+)[】\\]]`, "gi"),
      new RegExp(`[（(\\[【]${escapedWord}[）)\\]】]\\s*[（(]([^）)]+)[）)]`, "gi"),
      new RegExp(`[【\\[]${escapedWord}[】\\]]\\s*[【\\[]([^\\]】]+)[】\\]]`, "gi"),
    ];

    for (const pattern of pairedPatterns) {
      normalized = normalized.replace(pattern, (_match, capturedMeaning: string) => {
        const meaning = capturedMeaning?.trim() || fallbackMeaning;
        return meaning ? `${word}【${meaning}】` : word;
      });
    }

    normalized = normalized.replace(
      new RegExp(`${escapedWord}\\s*\\[([^\\]]+)\\]`, "gi"),
      (_match, capturedMeaning: string) => `${word}【${capturedMeaning.trim()}】`
    );
    normalized = normalized.replace(
      new RegExp(`${escapedWord}\\s*[（(]([^）)]+)[）)]`, "gi"),
      (_match, capturedMeaning: string) => `${word}【${capturedMeaning.trim()}】`
    );
  }

  return normalized;
}

/**
 * If the AI failed to include a word definition table,
 * programmatically append one using the input words.
 */
function ensureWordTable(content: string, words: WordEntry[]): string {
  // Check if content already has a markdown table (|---|)
  if (/\|[\s-]+\|/.test(content)) {
    return content;
  }

  const table = `

---
### 📖 单词释义
| 单词 | 词性 | 音标 | 中文释义 | 英文释义 |
|------|------|------|----------|----------|
${words
    .map((w) => {
      const pos = w.partOfSpeech || "-";
      const en = w.meaningEn || "-";
      const zh = (w.meaningZh && w.meaningZh !== "待查询" && w.meaningZh !== "（请参考英文释义）")
        ? w.meaningZh : "-";
      return `| ${w.word} | ${pos} | - | ${zh} | ${en} |`;
    })
    .join("\n")}`;

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
          let message = "生成失败";
          try {
            const data = await response.json();
            message = data.error || message;
          } catch {
            message = "服务器内部错误，请稍后重试";
          }
          throw new Error(message);
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

        const normalizedContent = normalizeStoryAnnotations(fullContent, words);
        const finalContent = ensureWordTable(normalizedContent, words);
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
