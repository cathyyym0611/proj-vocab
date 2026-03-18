"use client";
import { useState, useCallback } from "react";
import type { GREWord } from "@/types";

export function useGRELibrary() {
  const [words, setWords] = useState<GREWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(
    async (q: string = "", difficulty?: string, pageNum: number = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (difficulty) params.set("difficulty", difficulty);
        params.set("page", String(pageNum));
        params.set("limit", "50");

        const response = await fetch(`/api/words?${params}`);
        const data = await response.json();
        setWords(data.words);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch {
        setWords([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { words, total, page, totalPages, isLoading, search };
}
