"use client";
import { useState, useMemo } from "react";
import { useWordbook } from "@/hooks/useWordbook";
import { StoryDisplay } from "@/components/story/StoryDisplay";
import { mergeWordsWithGlossary } from "@/lib/story-glossary";
import { STORY_STYLES } from "@/types";
import type { WordEntry, Story } from "@/types";
import Link from "next/link";

type ViewMode = "stories" | "words";
type CardPhase = "preview" | "story" | "quiz";
const STORIES_PER_PAGE = 5;

/* ===== Word List View: click-to-reveal row ===== */
function WordRevealRow({ word }: { word: WordEntry }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <span className="font-bold text-sm">{word.word}</span>
        {word.partOfSpeech && (
          <span className="text-xs text-muted ml-1.5">({word.partOfSpeech})</span>
        )}
      </div>
      {revealed ? (
        <div className="text-right">
          <p className="text-sm text-foreground">{word.meaningZh}</p>
          {word.meaningEn && (
            <p className="text-xs text-muted mt-0.5">{word.meaningEn}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="px-3 py-1 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors shrink-0"
        >
          显示释义
        </button>
      )}
    </div>
  );
}

/* ===== Match Game Component ===== */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function MatchGame({ words, onFinish }: { words: WordEntry[]; onFinish: () => void }) {
  const [shuffledWords] = useState(() => shuffleArray(words));
  const [shuffledMeanings] = useState(() => shuffleArray(words));

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState(false);

  function handleWordClick(word: string) {
    if (matched.has(word.toLowerCase())) return;
    setSelectedWord(word);
    setWrongPair(false);
  }

  function handleMeaningClick(meaningWord: WordEntry) {
    if (!selectedWord || matched.has(meaningWord.word.toLowerCase())) return;

    if (selectedWord.toLowerCase() === meaningWord.word.toLowerCase()) {
      setMatched((prev) => new Set([...prev, meaningWord.word.toLowerCase()]));
      setSelectedWord(null);
      setWrongPair(false);
    } else {
      setWrongPair(true);
      setTimeout(() => setWrongPair(false), 1200);
    }
  }

  const allMatched = matched.size === words.length;

  return (
    <div className="space-y-5 py-2">
      <div className="text-center">
        <p className="text-sm font-medium">将左侧英文单词与右侧中文释义配对</p>
        <p className="text-xs text-muted mt-1">已配对 {matched.size}/{words.length}</p>
      </div>

      {wrongPair && (
        <div className="text-center py-2 px-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-pulse">
          ✗ 不匹配，再试试！
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted text-center mb-3">英文单词</p>
          {shuffledWords.map((w) => {
            const isMatched = matched.has(w.word.toLowerCase());
            const isSelected = selectedWord?.toLowerCase() === w.word.toLowerCase();
            return (
              <button
                key={w.word}
                onClick={() => handleWordClick(w.word)}
                disabled={isMatched}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  isMatched
                    ? "bg-green-100 text-green-700 border border-green-200 opacity-60"
                    : isSelected
                    ? "bg-primary text-white border border-primary shadow-md scale-[1.02]"
                    : "bg-surface border border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {w.word}
                {isMatched && " ✓"}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted text-center mb-3">中文释义</p>
          {shuffledMeanings.map((w) => {
            const isMatched = matched.has(w.word.toLowerCase());
            return (
              <button
                key={w.word}
                onClick={() => handleMeaningClick(w)}
                disabled={isMatched || !selectedWord}
                className={`w-full py-3 px-4 rounded-xl text-sm transition-all text-center ${
                  isMatched
                    ? "bg-green-100 text-green-700 border border-green-200 opacity-60"
                    : selectedWord
                    ? "bg-surface border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    : "bg-surface border border-border opacity-50 cursor-not-allowed"
                }`}
              >
                {w.meaningZh}
                {isMatched && " ✓"}
              </button>
            );
          })}
        </div>
      </div>

      {allMatched && (
        <div className="text-center space-y-3 py-4">
          <p className="text-lg font-bold text-green-600">🎉 全部配对成功！</p>
          <p className="text-sm text-muted">你已经掌握了这些单词</p>
          <button
            onClick={onFinish}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            完成
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Story Card ===== */
function StoryCard({ story }: { story: Story }) {
  const [phase, setPhase] = useState<CardPhase>("preview");
  const styleInfo = STORY_STYLES.find((s) => s.value === story.style);

  return (
    <div className="p-5 bg-surface border border-border rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{styleInfo?.emoji}</span>
          <span className="text-sm text-muted">{styleInfo?.label}</span>
        </div>
        <span className="text-xs text-muted">
          {new Date(story.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </span>
      </div>

      {/* Words preview */}
      <div className="flex flex-wrap gap-2">
        {story.words.map((w) => (
          <span
            key={w.word}
            className="px-3 py-1.5 bg-primary/10 rounded-lg text-sm font-bold text-primary"
          >
            {w.word}
          </span>
        ))}
      </div>

      {/* Phase: Preview */}
      {phase === "preview" && (
        <button
          onClick={() => setPhase("story")}
          className="w-full py-2.5 border-2 border-dashed border-primary/30 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          查看记忆故事
        </button>
      )}

      {/* Phase: Story — interactive words in story body, no bottom word buttons */}
      {phase === "story" && (
        <>
          <div className="text-xs text-muted bg-primary/5 px-3 py-2 rounded-lg">
            💡 点击故事中高亮的单词可查看/隐藏中文释义
          </div>
          <StoryDisplay content={story.content} isStreaming={false} interactive />

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setPhase("preview")}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              收起故事
            </button>
            <button
              onClick={() => setPhase("quiz")}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              🎯 测试一下
            </button>
          </div>
        </>
      )}

      {/* Phase: Quiz */}
      {phase === "quiz" && (
        <>
          <MatchGame words={story.words} onFinish={() => setPhase("preview")} />
          <button
            onClick={() => setPhase("story")}
            className="w-full py-2 border border-border rounded-xl text-sm text-muted hover:bg-surface-hover transition-colors"
          >
            ← 返回故事
          </button>
        </>
      )}
    </div>
  );
}

/* ===== Main Review Page ===== */
export default function ReviewPage() {
  const { stories } = useWordbook();
  const [viewMode, setViewMode] = useState<ViewMode>("stories");
  const [page, setPage] = useState(1);

  const hydratedStories = useMemo(
    () =>
      stories.map((story) => ({
        ...story,
        words: mergeWordsWithGlossary(story.words, story.content),
      })),
    [stories]
  );

  const totalPages = Math.ceil(hydratedStories.length / STORIES_PER_PAGE);
  const pagedStories = useMemo(() => {
    const start = (page - 1) * STORIES_PER_PAGE;
    return hydratedStories.slice(start, start + STORIES_PER_PAGE);
  }, [hydratedStories, page]);

  // Collect all unique words
  const allWords = useMemo(() => {
    const seen = new Set<string>();
    const result: WordEntry[] = [];
    for (const story of hydratedStories) {
      for (const w of story.words) {
        const key = w.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(w);
        }
      }
    }
    return result;
  }, [hydratedStories]);

  if (hydratedStories.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔄</p>
        <h2 className="text-lg font-medium mb-2">还没有可复习的内容</h2>
        <p className="text-muted text-sm mb-4">先去生成一些记忆故事吧</p>
        <Link
          href="/generate"
          className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
        >
          去生成故事
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">复习</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setViewMode("stories"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "stories"
                ? "bg-primary text-white"
                : "border border-border hover:bg-surface-hover"
            }`}
          >
            故事列表
          </button>
          <button
            onClick={() => setViewMode("words")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "words"
                ? "bg-primary text-white"
                : "border border-border hover:bg-surface-hover"
            }`}
          >
            单词列表
          </button>
        </div>
      </div>

      {viewMode === "words" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            共 {allWords.length} 个单词，点击右侧按钮查看释义
          </p>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {allWords.map((w) => (
              <WordRevealRow key={w.word} word={w} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            共 {hydratedStories.length} 个故事
            {totalPages > 1 && `，第 ${page}/${totalPages} 页`}
          </p>

          {/* Story cards list */}
          <div className="space-y-4">
            {pagedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-surface-hover"
              >
                上一页
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "hover:bg-surface-hover"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-surface-hover"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
