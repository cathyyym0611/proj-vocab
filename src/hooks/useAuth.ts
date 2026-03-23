"use client";
import { useCallback, useEffect, useState } from "react";
import type { ClientSession } from "@/types";

interface AuthPayload {
  session: ClientSession | null;
}

async function postAuth(url: string, body?: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data as AuthPayload;
}

export function useAuth() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = (await res.json()) as AuthPayload;
      setSession(data.session ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = useCallback(async (email: string, password: string) => {
    const data = await postAuth("/api/auth/register", { email, password });
    setSession(data.session);
    return data.session;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await postAuth("/api/auth/login", { email, password });
    setSession(data.session);
    return data.session;
  }, []);

  const guestLogin = useCallback(async () => {
    const data = await postAuth("/api/auth/guest");
    setSession(data.session);
    return data.session;
  }, []);

  const logout = useCallback(async () => {
    await postAuth("/api/auth/logout");
    setSession(null);
  }, []);

  return { session, loading, refresh, register, login, guestLogin, logout };
}
