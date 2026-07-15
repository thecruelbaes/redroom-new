import 'server-only';
import { cookies } from 'next/headers';
import { createHash, timingSafeEqual } from 'crypto';

const COOKIE = 'rr_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

// Пароль админки. ОБЯЗАТЕЛЬНО задай ADMIN_PASSWORD в .env.local перед публикацией.
const PASSWORD = process.env.ADMIN_PASSWORD || 'redroom-admin';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'change-me-secret';

/** Используется ли небезопасный пароль/секрет по умолчанию — для предупреждения в UI. */
export const usingDefaultCreds =
  !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET;

function token(): string {
  return createHash('sha256').update(`${PASSWORD}::${SECRET}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  if (!input) return false;
  // сравнение по хэшу одинаковой длины — против тайминг-атак
  const ih = createHash('sha256').update(input).digest('hex');
  const ph = createHash('sha256').update(PASSWORD).digest('hex');
  return safeEqual(ih, ph);
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const val = store.get(COOKIE)?.value;
  if (!val) return false;
  return safeEqual(val, token());
}
