import type { WordEntry } from "@/types";

interface GlossaryRow {
  word: string;
  partOfSpeech?: string;
  phonetic?: string;
  meaningZh?: string;
  meaningEn?: string;
}

const HEADER_ALIASES = {
  "单词": "word",
  "词性": "partOfSpeech",
  "音标": "phonetic",
  "中文释义": "meaningZh",
  "英文释义": "meaningEn",
} as const;

type HeaderKey = keyof typeof HEADER_ALIASES;

function parseRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

export function extractGlossaryFromStory(content: string): GlossaryRow[] {
  const lines = content.split("\n");

  for (let i = 0; i < lines.length - 1; i++) {
    const headerLine = lines[i]?.trim();
    const separatorLine = lines[i + 1]?.trim();

    if (!headerLine?.includes("|") || !separatorLine?.includes("|")) continue;
    if (!headerLine.includes("单词") || !headerLine.includes("中文释义")) continue;

    const headers = parseRow(headerLine);
    const headerMap = headers.reduce<Record<string, number>>((acc, header, index) => {
      const key = HEADER_ALIASES[header as HeaderKey];
      if (key) acc[key] = index;
      return acc;
    }, {});

    if (headerMap.word === undefined) continue;

    const rows: GlossaryRow[] = [];
    let rowIndex = i + 2;
    while (rowIndex < lines.length) {
      const line = lines[rowIndex]?.trim();
      if (!line || !line.includes("|")) break;
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        rowIndex++;
        continue;
      }

      const cells = parseRow(line);
      const word = cells[headerMap.word];
      if (!word) break;

      rows.push({
        word,
        partOfSpeech: headerMap.partOfSpeech !== undefined ? cells[headerMap.partOfSpeech] : undefined,
        phonetic: headerMap.phonetic !== undefined ? cells[headerMap.phonetic] : undefined,
        meaningZh: headerMap.meaningZh !== undefined ? cells[headerMap.meaningZh] : undefined,
        meaningEn: headerMap.meaningEn !== undefined ? cells[headerMap.meaningEn] : undefined,
      });
      rowIndex++;
    }

    if (rows.length > 0) return rows;
  }

  return [];
}

export function mergeWordsWithGlossary(words: WordEntry[], content: string): WordEntry[] {
  const glossaryRows = extractGlossaryFromStory(content);
  if (glossaryRows.length === 0) return words;

  return words.map((word) => {
    const glossary = glossaryRows.find(
      (row) => row.word.toLowerCase() === word.word.toLowerCase()
    );

    if (!glossary) return word;

    const nextMeaningZh =
      glossary.meaningZh &&
      glossary.meaningZh !== "-" &&
      glossary.meaningZh !== "（请参考英文释义）"
        ? glossary.meaningZh
        : word.meaningZh;

    const nextMeaningEn =
      glossary.meaningEn && glossary.meaningEn !== "-"
        ? glossary.meaningEn
        : word.meaningEn;

    const nextPos =
      glossary.partOfSpeech && glossary.partOfSpeech !== "-"
        ? glossary.partOfSpeech
        : word.partOfSpeech;

    return {
      ...word,
      meaningZh: nextMeaningZh,
      meaningEn: nextMeaningEn,
      partOfSpeech: nextPos,
    };
  });
}
