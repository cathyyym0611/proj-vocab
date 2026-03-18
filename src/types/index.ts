export interface WordEntry {
  word: string;
  meaningEn: string;
  meaningZh: string;
  partOfSpeech?: string;
}

export interface SavedWord {
  id?: number;
  word: string;
  meaningEn: string;
  meaningZh: string;
  partOfSpeech?: string;
  difficulty?: "basic" | "common" | "advanced";
  source?: string;
  addedAt: number;
  reviewCount: number;
  lastReviewedAt?: number;
}

export interface Story {
  id?: number;
  title: string;
  content: string;
  style: StoryStyle;
  words: WordEntry[];
  createdAt: number;
  wordbookId?: number;
  isFavorite: boolean;
}

export interface Wordbook {
  id?: number;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export type StoryStyle = "palace" | "mystery" | "romance" | "wuxia";

export interface StoryStyleOption {
  value: StoryStyle;
  label: string;
  description: string;
  emoji: string;
}

export const STORY_STYLES: StoryStyleOption[] = [
  {
    value: "palace",
    label: "宫斗权谋",
    description: "甄嬛传风格，后宫权谋与尔虞我诈",
    emoji: "👑",
  },
  {
    value: "mystery",
    label: "悬疑推理",
    description: "层层悬念，出人意料的反转",
    emoji: "🔍",
  },
  {
    value: "romance",
    label: "都市言情",
    description: "狗血虐恋，爱恨交织的名场面",
    emoji: "💔",
  },
  {
    value: "wuxia",
    label: "武侠江湖",
    description: "刀光剑影，侠义恩仇",
    emoji: "⚔️",
  },
];

export type ExamType = "gre" | "toefl" | "ielts";

export interface ExamOption {
  value: ExamType;
  label: string;
}

export const EXAM_OPTIONS: ExamOption[] = [
  { value: "gre", label: "GRE" },
  { value: "toefl", label: "托福" },
  { value: "ielts", label: "雅思" },
];

export interface GREWord {
  word: string;
  meaningEn: string;
  meaningZh: string;
  partOfSpeech: string;
  difficulty: "basic" | "common" | "advanced";
  source: string[];
}

export interface GenerateRequest {
  words: WordEntry[];
  style: StoryStyle;
  customPrompt?: string;
}
