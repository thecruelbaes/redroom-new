import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Настроен ли Supabase (есть URL + публичный ключ). Если нет — сайт работает на статике. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Публичный клиент (anon/publishable) — только чтение опубликованного. Безопасен на сервере. */
export function getPublicClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/** Админский клиент (service_role/secret) — обходит RLS. ТОЛЬКО на сервере, никогда не на клиенте. */
export function getAdminClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
