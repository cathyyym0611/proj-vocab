"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { SavedWord } from "@/types";

export function useWords() {
  const words = useLiveQuery(() => db.words.orderBy("addedAt").reverse().toArray());

  async function addWord(word: Omit<SavedWord, "id" | "addedAt" | "reviewCount">) {
    const existing = await db.words.where("word").equals(word.word).first();
    if (existing) return existing.id;
    return db.words.add({
      ...word,
      addedAt: Date.now(),
      reviewCount: 0,
    });
  }

  async function removeWord(id: number) {
    return db.words.delete(id);
  }

  async function updateReview(id: number) {
    return db.words.update(id, {
      reviewCount: (await db.words.get(id))!.reviewCount + 1,
      lastReviewedAt: Date.now(),
    });
  }

  return { words: words || [], addWord, removeWord, updateReview };
}
