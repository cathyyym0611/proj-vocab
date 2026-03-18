import greWords from "@/data/gre-words.json";
import toeflWords from "@/data/toefl-words.json";
import ieltsWords from "@/data/ielts-words.json";
import type { GREWord, ExamType } from "@/types";

const wordsByExam: Record<ExamType, GREWord[]> = {
  gre: greWords as GREWord[],
  toefl: toeflWords as GREWord[],
  ielts: ieltsWords as GREWord[],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const difficulty = searchParams.get("difficulty");
  const exam = (searchParams.get("exam") || "gre") as ExamType;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const searchAll = searchParams.get("searchAll") === "true";

  // If searchAll, search across all exams (for word input autocomplete)
  let words: GREWord[];
  if (searchAll) {
    const allWords = [
      ...wordsByExam.gre,
      ...wordsByExam.toefl,
      ...wordsByExam.ielts,
    ];
    // Deduplicate by word
    const seen = new Set<string>();
    words = allWords.filter((w) => {
      const key = w.word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } else {
    words = wordsByExam[exam] || [];
  }

  let filtered = words;

  if (q) {
    filtered = filtered.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaningZh.includes(q) ||
        w.meaningEn.toLowerCase().includes(q)
    );
  }

  if (difficulty && ["basic", "common", "advanced"].includes(difficulty)) {
    filtered = filtered.filter((w) => w.difficulty === difficulty);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return Response.json({
    words: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
