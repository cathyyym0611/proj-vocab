"use client";
import { useMemo } from "react";
import { WordAnnotation } from "./WordAnnotation";
import { InteractiveWord } from "./InteractiveWord";

interface StoryDisplayProps {
  content: string;
  isStreaming: boolean;
  /** When true, word meanings in story body are hidden until clicked */
  interactive?: boolean;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

function parseTable(lines: string[], startIdx: number): { table: TableData; endIdx: number } | null {
  const headerLine = lines[startIdx];
  if (!headerLine || !headerLine.includes("|")) return null;

  const separatorLine = lines[startIdx + 1];
  if (!separatorLine || !/^\|[\s\-|]+\|$/.test(separatorLine.trim())) return null;

  const parseRow = (line: string): string[] =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headers = parseRow(headerLine);
  const rows: string[][] = [];

  let i = startIdx + 2;
  while (i < lines.length && lines[i].includes("|") && !lines[i].match(/^---+$/)) {
    rows.push(parseRow(lines[i]));
    i++;
  }

  return { table: { headers, rows }, endIdx: i - 1 };
}

// Column width classes by index: 单词(0), 音标(1), 词性(2), 英文释义(3), 中文释义(4)
const COL_CLASSES = [
  "font-bold text-primary w-[15%]",        // 单词
  "text-muted font-mono text-xs w-[15%]",  // 音标
  "text-foreground w-[10%]",               // 词性
  "text-foreground w-[30%]",               // 英文释义
  "text-foreground w-[30%]",               // 中文释义
];

const HEADER_CLASSES = [
  "text-left py-2.5 px-3 font-bold text-primary text-xs tracking-wide w-[15%]",
  "text-left py-2.5 px-3 font-bold text-primary text-xs tracking-wide w-[15%]",
  "text-left py-2.5 px-3 font-bold text-primary text-xs tracking-wide w-[10%]",
  "text-left py-2.5 px-3 font-bold text-primary text-xs tracking-wide w-[30%]",
  "text-left py-2.5 px-3 font-bold text-primary text-xs tracking-wide w-[30%]",
];

function parseStoryContent(content: string, interactive: boolean): React.ReactNode[] {
  const lines = content.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push(
        <hr key={`hr-${i}`} className="my-5 border-border" />
      );
      i++;
      continue;
    }

    // Try to parse table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1]?.includes("---")) {
      const tableResult = parseTable(lines, i);
      if (tableResult) {
        const { table, endIdx } = tableResult;
        result.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse table-fixed min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  {table.headers.map((h, hi) => (
                    <th key={hi} className={HEADER_CLASSES[hi] || HEADER_CLASSES[0]}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-2.5 px-3 ${COL_CLASSES[ci] || "text-foreground"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = endIdx + 1;
        continue;
      }
    }

    // Heading (## Title)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      const className =
        level === 1
          ? "text-xl font-bold mb-3 mt-2"
          : level === 2
          ? "text-lg font-bold mb-3 mt-2"
          : "text-base font-semibold mb-2 mt-4 flex items-center gap-2";
      result.push(
        <Tag key={`h-${i}`} className={className}>
          {parseInlineContent(text, i, interactive)}
        </Tag>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      result.push(<br key={`br-${i}`} />);
      i++;
      continue;
    }

    // Regular paragraph
    result.push(
      <span key={`line-${i}`}>
        {parseInlineContent(line, i, interactive)}
        {i < lines.length - 1 ? "\n" : ""}
      </span>
    );
    i++;
  }

  return result;
}

function parseInlineContent(
  text: string,
  lineIdx: number,
  interactive: boolean
): React.ReactNode[] {
  // Match: word【meaning】 and **bold**
  const regex = /([a-zA-Z]+)【([^】]+)】|\*\*([^*]+)\*\*/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      if (interactive) {
        // Interactive mode: click to reveal meaning
        nodes.push(
          <InteractiveWord
            key={`iw-${lineIdx}-${match.index}`}
            word={match[1]}
            meaning={match[2]}
          />
        );
      } else {
        // Default mode: hover tooltip
        nodes.push(
          <WordAnnotation
            key={`w-${lineIdx}-${match.index}`}
            word={match[1]}
            meaning={match[2]}
          />
        );
      }
    } else if (match[3]) {
      nodes.push(
        <strong key={`b-${lineIdx}-${match.index}`} className="font-bold">
          {match[3]}
        </strong>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function StoryDisplay({ content, isStreaming, interactive = false }: StoryDisplayProps) {
  const parsedContent = useMemo(() => {
    if (isStreaming) return null;
    return parseStoryContent(content, interactive);
  }, [content, isStreaming, interactive]);

  if (!content) return null;

  return (
    <div className="mt-6 p-6 md:p-8 bg-surface border border-border rounded-2xl">
      <div className="max-w-none">
        {isStreaming ? (
          <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
            {content}
            <span className="streaming-cursor" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
            {parsedContent}
          </div>
        )}
      </div>
    </div>
  );
}
