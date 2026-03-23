"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { WordEntry } from "@/types";
import { WordTag } from "./WordTag";

interface Suggestion {
  word: string;
  meaningEn: string;
  meaningZh: string;
  partOfSpeech?: string;
}

interface WordInputPanelProps {
  words: WordEntry[];
  onWordsChange: (words: WordEntry[]) => void;
}

export function WordInputPanel({ words, onWordsChange }: WordInputPanelProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchWords = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    const results: Suggestion[] = [];
    const seen = new Set<string>();

    // Use Datamuse only so suggestions follow normal word-frequency autocomplete.
    if (query.length >= 2) {
      try {
        const res = await fetch(
          `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=8`
        );
        const data: { word: string; score: number }[] = await res.json();
        for (const item of data) {
          const key = item.word.toLowerCase();
          if (seen.has(key) || item.word.includes(" ")) continue;
          if (!/^[a-zA-Z]+$/.test(item.word)) continue;
          seen.add(key);
          results.push({
            word: item.word,
            meaningEn: "",
            meaningZh: "待查询",
          });
          if (results.length >= 8) break;
        }
      } catch {
        // ignore
      }
    }

    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchWords(input.trim()), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, searchWords]);

  const MAX_WORDS = 5;
  const isFull = words.length >= MAX_WORDS;

  function addWord(word: WordEntry) {
    if (isFull) return;
    if (words.some((w) => w.word.toLowerCase() === word.word.toLowerCase())) return;
    onWordsChange([...words, word]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }

  function addCustomWord() {
    const trimmed = input.trim();
    if (!trimmed) return;
    addWord({
      word: trimmed,
      meaningEn: "",
      meaningZh: "待查询",
    });
  }

  function removeWord(index: number) {
    onWordsChange(words.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        const s = suggestions[selectedIndex];
        addWord({ word: s.word, meaningEn: s.meaningEn, meaningZh: s.meaningZh, partOfSpeech: s.partOfSpeech });
      } else {
        addCustomWord();
      }
    } else if (e.key === "Backspace" && !input && words.length > 0) {
      removeWord(words.length - 1);
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        输入要记忆的单词
        <span className={`ml-2 font-normal ${isFull ? "text-accent" : "text-muted"}`}>
          ({words.length}/{MAX_WORDS})
        </span>
      </label>

      <div
        className="flex flex-wrap gap-2 p-3 border border-border rounded-xl bg-surface min-h-[52px] cursor-text focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {words.map((word, i) => (
          <WordTag key={word.word} word={word} onRemove={() => removeWord(i)} />
        ))}
        {!isFull && (
        <div className="relative flex-1 min-w-[150px]">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={words.length === 0 ? "输入你想记忆的单词..." : "继续添加..."}
            className="w-full py-1.5 bg-transparent outline-none text-sm placeholder:text-muted/50"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 mt-2 w-80 max-h-64 overflow-auto bg-surface border border-border rounded-xl shadow-lg z-50"
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.word}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addWord({
                      word: s.word,
                      meaningEn: s.meaningEn,
                      meaningZh: s.meaningZh,
                      partOfSpeech: s.partOfSpeech,
                    });
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-surface-hover transition-colors ${
                    i === selectedIndex ? "bg-surface-hover" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.word}</span>
                    {s.partOfSpeech && (
                      <span className="text-xs text-muted">({s.partOfSpeech})</span>
                    )}
                  </div>
                  {s.meaningZh && s.meaningZh !== "待查询" && (
                    <span className="text-xs text-muted ml-2 truncate max-w-[120px]">{s.meaningZh}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      <p className="text-xs text-muted">
        {isFull
          ? "已达上限，删除已有单词后可继续添加。"
          : "输入单词后按 Enter 添加，输入时会按常见词频推荐完整单词。每次最多 5 个单词。"}
      </p>
    </div>
  );
}
