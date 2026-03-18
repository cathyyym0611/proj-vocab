"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Story, Wordbook, WordEntry, StoryStyle } from "@/types";

export function useWordbook() {
  const wordbooks = useLiveQuery(() =>
    db.wordbooks.orderBy("updatedAt").reverse().toArray()
  );

  const stories = useLiveQuery(() =>
    db.stories.orderBy("createdAt").reverse().toArray()
  );

  async function createWordbook(name: string, description?: string) {
    return db.wordbooks.add({
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async function deleteWordbook(id: number) {
    await db.stories.where("wordbookId").equals(id).delete();
    return db.wordbooks.delete(id);
  }

  async function saveStory(
    title: string,
    content: string,
    style: StoryStyle,
    words: WordEntry[],
    wordbookId?: number
  ) {
    const storyId = await db.stories.add({
      title,
      content,
      style,
      words,
      createdAt: Date.now(),
      wordbookId,
      isFavorite: false,
    });
    if (wordbookId) {
      await db.wordbooks.update(wordbookId, { updatedAt: Date.now() });
    }
    return storyId;
  }

  async function deleteStory(id: number) {
    return db.stories.delete(id);
  }

  async function toggleFavorite(id: number) {
    const story = await db.stories.get(id);
    if (story) {
      return db.stories.update(id, { isFavorite: !story.isFavorite });
    }
  }

  async function getStoriesByWordbook(wordbookId: number): Promise<Story[]> {
    return db.stories.where("wordbookId").equals(wordbookId).toArray();
  }

  return {
    wordbooks: wordbooks || [],
    stories: stories || [],
    createWordbook,
    deleteWordbook,
    saveStory,
    deleteStory,
    toggleFavorite,
    getStoriesByWordbook,
  };
}
