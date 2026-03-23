import { cookies } from "next/headers";
import { getRedis } from "@/lib/redis";

export const SESSION_COOKIE = "vocab_session";
export const GUEST_COOKIE = "vocab_guest_id";
export const GUEST_DAILY_LIMIT = 5;
export const USER_DAILY_LIMIT = 10;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionType = "guest" | "user";

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
}

export interface AuthSessionRecord {
  token: string;
  type: SessionType;
  userId?: string;
  email?: string;
  guestId?: string;
  createdAt: number;
}

export interface AuthSession {
  token: string;
  type: SessionType;
  email: string | null;
  isAuthenticated: boolean;
  guestId?: string;
}

interface MemoryStore {
  users: Map<string, AuthUserRecord>;
  sessions: Map<string, AuthSessionRecord>;
}

const memoryStore: MemoryStore = {
  users: new Map<string, AuthUserRecord>(),
  sessions: new Map<string, AuthSessionRecord>(),
};

function now() {
  return Date.now();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function randomToken(bytes: number) {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString("hex");
}

async function derivePassword(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: Buffer.from(saltHex, "hex"),
      iterations: 120000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return Buffer.from(derivedBits).toString("hex");
}

export async function hashPassword(password: string) {
  const salt = randomToken(16);
  const hash = await derivePassword(password, salt);
  return { salt, hash };
}

export async function verifyPassword(password: string, salt: string, hash: string) {
  const derived = await derivePassword(password, salt);
  return derived === hash;
}

async function getUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const normalized = normalizeEmail(email);
  const redis = getRedis();

  if (redis) {
    const record = await redis.get<AuthUserRecord>(`auth:user:${normalized}`);
    return record ?? null;
  }

  return memoryStore.users.get(normalized) ?? null;
}

export async function createUser(email: string, password: string): Promise<AuthUserRecord> {
  const normalized = normalizeEmail(email);
  const existing = await getUserByEmail(normalized);
  if (existing) {
    throw new Error("该邮箱已注册，请直接登录");
  }

  const { salt, hash } = await hashPassword(password);
  const user: AuthUserRecord = {
    id: randomToken(12),
    email: normalized,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now(),
  };

  const redis = getRedis();
  if (redis) {
    await redis.set(`auth:user:${normalized}`, user);
  } else {
    memoryStore.users.set(normalized, user);
  }

  return user;
}

export async function authenticateUser(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const user = await getUserByEmail(normalized);
  if (!user) return null;

  const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  return ok ? user : null;
}

async function saveSession(record: AuthSessionRecord) {
  const redis = getRedis();
  if (redis) {
    await redis.set(`auth:session:${record.token}`, record, {
      ex: SESSION_TTL_SECONDS,
    });
    return;
  }
  memoryStore.sessions.set(record.token, record);
}

async function getSessionRecord(token: string): Promise<AuthSessionRecord | null> {
  const redis = getRedis();
  if (redis) {
    const record = await redis.get<AuthSessionRecord>(`auth:session:${token}`);
    return record ?? null;
  }

  return memoryStore.sessions.get(token) ?? null;
}

async function deleteSessionRecord(token: string) {
  const redis = getRedis();
  if (redis) {
    await redis.del(`auth:session:${token}`);
    return;
  }
  memoryStore.sessions.delete(token);
}

export async function createSession(
  input:
    | { type: "guest"; guestId: string }
    | { type: "user"; userId: string; email: string }
): Promise<AuthSessionRecord> {
  const token = randomToken(24);
  const record: AuthSessionRecord = {
    token,
    type: input.type,
    userId: input.type === "user" ? input.userId : undefined,
    email: input.type === "user" ? normalizeEmail(input.email) : undefined,
    guestId: input.type === "guest" ? input.guestId : undefined,
    createdAt: now(),
  };
  await saveSession(record);
  return record;
}

export async function getOrCreateGuestId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const guestId = randomToken(16);
  cookieStore.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return guestId;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const record = await getSessionRecord(token);
  if (!record) return null;

  return {
    token: record.token,
    type: record.type,
    email: record.email ?? null,
    isAuthenticated: record.type === "user",
    guestId: record.guestId,
  };
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSessionRecord(token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function getDailyLimitForSession(session: AuthSession | null) {
  if (!session) return 0;
  return session.type === "user" ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
}

export function getQuotaSubject(session: AuthSession) {
  return session.type === "user"
    ? `user:${session.email}`
    : `guest:${session.guestId ?? session.token}`;
}
