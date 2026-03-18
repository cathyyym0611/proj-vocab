"use client";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { WordEntry, StoryStyle } from "@/types";
import { WordInputPanel } from "@/components/word-input/WordInputPanel";
import { StyleSelector } from "@/components/word-input/StyleSelector";
import { StoryDisplay } from "@/components/story/StoryDisplay";
import { StoryActions } from "@/components/story/StoryActions";
import { useStoryGeneration } from "@/hooks/useStoryGeneration";
import { useWordbook } from "@/hooks/useWordbook";
import { useDailyLimit } from "@/hooks/useDailyLimit";

const MAX_REGENERATIONS = 2;

function GenerateContent() {
  const searchParams = useSearchParams();
  const [words, setWords] = useState<WordEntry[]>([]);
  const [style, setStyle] = useState<StoryStyle>("palace");
  const [skippedWords, setSkippedWords] = useState<string[]>([]);
  const [regenCount, setRegenCount] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const validatedWordsRef = useRef<WordEntry[]>([]);
  const styleRef = useRef<StoryStyle>("palace");
  const { story, isGenerating, error, generate, reset, serverRemaining } = useStoryGeneration();
  const { saveStory } = useWordbook();
  const { remaining, canGenerate, updateRemaining, resetTime, dailyLimit } = useDailyLimit();

  // Keep styleRef in sync
  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  // Sync remaining count from server response after generation
  useEffect(() => {
    if (serverRemaining !== null) {
      updateRemaining(serverRemaining);
    }
  }, [serverRemaining, updateRemaining]);

  // Auto-save when generation completes
  useEffect(() => {
    if (!isGenerating && story && !autoSaved) {
      const titleMatch = story.match(/^##\s*(.+)/m);
      const title = titleMatch?.[1] || "记忆故事";
      const wordsToSave = validatedWordsRef.current.length > 0
        ? validatedWordsRef.current
        : words;
      saveStory(title, story, styleRef.current, wordsToSave);
      setAutoSaved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, story]);

  // Load words from URL query params
  useEffect(() => {
    const word = searchParams.get("word");
    const meaning = searchParams.get("meaning");
    const meaningEn = searchParams.get("meaningEn");
    if (word && !words.some((w) => w.word.toLowerCase() === word.toLowerCase())) {
      setWords((prev) => [
        ...prev,
        { word, meaningZh: meaning || "待查询", meaningEn: meaningEn || "" },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateAndGenerate = useCallback(
    async (wordsToUse: WordEntry[], isRegen: boolean) => {
      // Server enforces the daily limit — if we know we're out, skip the request
      if (!canGenerate) return;

      // Reset auto-save flag for new generation
      setAutoSaved(false);

      const validWords: WordEntry[] = [];
      const unknownWords: string[] = [];

      for (const w of wordsToUse) {
        if (w.meaningEn || (w.meaningZh && w.meaningZh !== "待查询")) {
          validWords.push(w);
        } else {
          // Try to look up from our API first
          try {
            const res = await fetch(
              `/api/words?q=${encodeURIComponent(w.word)}&limit=1&searchAll=true`
            );
            const data = await res.json();
            const match = data.words?.find(
              (dw: { word: string }) =>
                dw.word.toLowerCase() === w.word.toLowerCase()
            );
            if (match) {
              validWords.push({
                word: match.word,
                meaningEn: match.meaningEn,
                meaningZh: match.meaningZh,
                partOfSpeech: match.partOfSpeech,
              });
              continue;
            }
          } catch {
            // ignore
          }

          // Try dictionary API
          try {
            const res = await fetch(
              `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w.word)}`
            );
            if (res.ok) {
              const data = await res.json();
              const allMeanings = data[0]?.meanings || [];
              const firstMeaning = allMeanings[0];
              const def = firstMeaning?.definitions?.[0]?.definition || "";
              const pos = allMeanings.map((m: { partOfSpeech: string }) => m.partOfSpeech).join("/");
              if (def) {
                validWords.push({
                  word: w.word,
                  meaningEn: def,
                  meaningZh: "（请参考英文释义）",
                  partOfSpeech: pos,
                });
                continue;
              }
            }
          } catch {
            // ignore
          }

          unknownWords.push(w.word);
        }
      }

      setSkippedWords(unknownWords);

      if (validWords.length === 0) {
        return;
      }

      // Store validated words for auto-save
      validatedWordsRef.current = validWords;

      // Update the words state with looked-up meanings
      setWords((prev) =>
        prev.map((w) => {
          const validated = validWords.find(
            (vw) => vw.word.toLowerCase() === w.word.toLowerCase()
          );
          return validated || w;
        })
      );

      if (isRegen) {
        reset();
        setRegenCount((prev) => prev + 1);
      } else {
        setRegenCount(0);
        setHasGenerated(true);
      }

      generate(validWords, style);
    },
    [style, generate, reset, canGenerate]
  );

  function handleGenerate() {
    if (words.length === 0) return;
    validateAndGenerate(words, false);
  }

  function handleRegenerate() {
    if (words.length === 0 || regenCount >= MAX_REGENERATIONS) return;
    validateAndGenerate(words, true);
  }

  const canRegenerate = hasGenerated && regenCount < MAX_REGENERATIONS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">生成记忆故事</h1>
        <p className="text-muted text-sm mt-1">
          输入你觉得难记的单词，AI会把它们编织成一个令人印象深刻的故事
        </p>
      </div>

      {/* Daily limit indicator */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
        canGenerate
          ? "bg-primary/5 border border-primary/10"
          : "bg-yellow-50 border border-yellow-200"
      }`}>
        {canGenerate ? (
          <>
            <span className="text-primary">✨</span>
            <span className="text-muted">
              今日剩余 <span className="font-bold text-primary">{remaining}</span>/{dailyLimit} 次生成机会
            </span>
          </>
        ) : (
          <>
            <span>🌙</span>
            <span className="text-yellow-800">
              今日生成次数已用完，{resetTime}后重置。
              <span className="block text-yellow-600 mt-0.5">
                先去复习已有的故事吧，间隔复习效果更好哦！
              </span>
            </span>
          </>
        )}
      </div>

      <div className="space-y-5 p-6 bg-surface border border-border rounded-2xl">
        <WordInputPanel words={words} onWordsChange={setWords} />
        <StyleSelector value={style} onChange={setStyle} />

        <button
          onClick={handleGenerate}
          disabled={words.length === 0 || isGenerating || !canGenerate}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              故事生成中...
            </span>
          ) : !canGenerate ? (
            "今日次数已用完"
          ) : (
            `生成故事 (${words.length} 个单词)`
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {skippedWords.length > 0 && !isGenerating && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
          以下单词未找到释义，已跳过：
          <span className="font-bold ml-1">{skippedWords.join(", ")}</span>
          <span className="text-yellow-600 ml-1">（请检查拼写是否正确）</span>
        </div>
      )}

      <StoryDisplay content={story} isStreaming={isGenerating} />

      {!isGenerating && story && (
        <div className="space-y-3">
          {/* Auto-saved indicator */}
          {autoSaved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span>✓</span>
              <span>已自动保存到单词本</span>
            </div>
          )}
          <StoryActions
            content={story}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
            canRegenerate={canRegenerate}
            regenCount={regenCount}
            maxRegenCount={MAX_REGENERATIONS}
          />
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">生成记忆故事</h1>
            <p className="text-muted text-sm mt-1">加载中...</p>
          </div>
        </div>
      }
    >
      <GenerateContent />
    </Suspense>
  );
}
