import Dexie, { type EntityTable } from "dexie";
import type { SavedWord, Story, Wordbook } from "@/types";

const db = new Dexie("VocabStoryDB") as Dexie & {
  words: EntityTable<SavedWord, "id">;
  stories: EntityTable<Story, "id">;
  wordbooks: EntityTable<Wordbook, "id">;
};

db.version(2).stores({
  words: "++id, word, difficulty, source, addedAt",
  stories: "++id, style, createdAt, wordbookId, isFavorite",
  wordbooks: "++id, name, createdAt, updatedAt",
});

export { db };
