"use client";
import { useState, useCallback, useEffect } from "react";

const DEFAULT_LIMIT = 10;

function getResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}

export function useDailyLimit() {
  const [remaining, setRemaining] = useState(DEFAULT_LIMIT);
  const [dailyLimit, setDailyLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);

  // Fetch remaining count from server on mount
  useEffect(() => {
    async function fetchLimit() {
      try {
        const res = await fetch("/api/limit");
        if (res.ok) {
          const data = await res.json();
          setRemaining(data.remaining ?? DEFAULT_LIMIT);
          setDailyLimit(data.limit ?? DEFAULT_LIMIT);
        }
      } catch {
        // If fetch fails, keep defaults
      } finally {
        setLoading(false);
      }
    }
    fetchLimit();
  }, []);

  // Update remaining count (called after server responds with new count)
  const updateRemaining = useCallback((newRemaining: number) => {
    setRemaining(newRemaining);
  }, []);

  // Refresh from server
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/limit");
      if (res.ok) {
        const data = await res.json();
        setRemaining(data.remaining ?? DEFAULT_LIMIT);
        setDailyLimit(data.limit ?? DEFAULT_LIMIT);
      }
    } catch {
      // ignore
    }
  }, []);

  const canGenerate = remaining > 0;
  const resetTime = getResetTime();

  return { remaining, canGenerate, updateRemaining, refresh, resetTime, dailyLimit, loading };
}
