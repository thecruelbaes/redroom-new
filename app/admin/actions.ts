'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkPassword, createSession, destroySession, isAuthed } from '@/lib/auth';
import { createReview, deleteReview, togglePublished } from '@/lib/reviews';

export type FormState = { error?: string; ok?: boolean };

// Анти-брутфорс: не больше 8 попыток входа за 5 минут с одного IP.
const loginAttempts = new Map<string, { count: number; ts: number }>();
const LOGIN_WINDOW = 5 * 60_000;
const LOGIN_MAX = 8;

async function loginThrottled(): Promise<boolean> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const now = Date.now();
  if (loginAttempts.size > 2000) {
    for (const [k, v] of loginAttempts) if (now - v.ts > LOGIN_WINDOW) loginAttempts.delete(k);
  }
  const rec = loginAttempts.get(ip);
  if (!rec || now - rec.ts > LOGIN_WINDOW) {
    loginAttempts.set(ip, { count: 1, ts: now });
    return false;
  }
  rec.count += 1;
  return rec.count > LOGIN_MAX;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (await loginThrottled()) {
    return { error: 'Слишком много попыток. Подождите несколько минут.' };
  }
  const password = String(formData.get('password') || '');
  if (!checkPassword(password)) {
    return { error: 'Неверный пароль' };
  }
  await createSession();
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/admin');
}

async function guard() {
  if (!(await isAuthed())) {
    throw new Error('Не авторизован');
  }
}

export async function addReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await guard();
  const name = String(formData.get('name') || '').trim().slice(0, 80);
  const text = String(formData.get('text') || '').trim().slice(0, 800);
  const source = String(formData.get('source') || 'ученик').trim().slice(0, 40);
  const rating = Math.min(5, Math.max(1, Number(formData.get('rating')) || 5));
  const sort_order = Number(formData.get('sort_order')) || 0;

  if (!name || !text) {
    return { error: 'Заполните имя и текст отзыва' };
  }
  const res = await createReview({ name, text, source, rating, sort_order });
  if (!res.ok) return { error: res.error || 'Не удалось сохранить' };

  revalidatePath('/');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get('id') || '');
  if (id) {
    await deleteReview(id);
    revalidatePath('/');
    revalidatePath('/admin');
  }
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get('id') || '');
  const published = String(formData.get('published')) === 'true';
  if (id) {
    await togglePublished(id, !published);
    revalidatePath('/');
    revalidatePath('/admin');
  }
}
