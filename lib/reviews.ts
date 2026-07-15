import 'server-only';
import { getPublicClient, getAdminClient } from './supabase';
import { REVIEWS as STATIC_REVIEWS } from './content';

export type Review = {
  id: string;
  name: string;
  text: string;
  source: string; // в RedRoom это «роль/подпись», напр. «ученица · барабаны»
  rating: number;
  published: boolean;
  sort_order: number;
  created_at?: string;
};

/** Форма отзыва для публичной секции сайта (совпадает с content.ts REVIEWS). */
export type PublicReview = { name: string; role: string; text: string };

/** Отзывы для публичной секции. Supabase → fallback на статику из content.ts. */
export async function getPublicReviews(): Promise<PublicReview[]> {
  const supabase = getPublicClient();
  if (!supabase) {
    return STATIC_REVIEWS;
  }
  const { data, error } = await supabase
    .from('reviews')
    .select('name, text, source')
    .eq('published', true)
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12);

  if (error || !data || data.length === 0) {
    if (error) console.error('[reviews] supabase read error:', error.message);
    return STATIC_REVIEWS;
  }
  // Мапим в формат, который ждёт компонент: role = source (подпись под именем).
  return data.map((r) => ({ name: r.name, role: r.source, text: r.text }));
}

/** Все отзывы для админки (включая снятые с публикации). Требует service_role. */
export async function getAllReviews(): Promise<Review[]> {
  const supabase = getAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[reviews] admin read error:', error.message);
    return [];
  }
  return (data ?? []) as Review[];
}

export async function createReview(input: {
  name: string;
  text: string;
  source: string;
  rating: number;
  sort_order?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminClient();
  if (!supabase) return { ok: false, error: 'Supabase не настроен' };
  const { error } = await supabase.from('reviews').insert({
    name: input.name,
    text: input.text,
    source: input.source,
    rating: input.rating,
    sort_order: input.sort_order ?? 0,
    published: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteReview(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminClient();
  if (!supabase) return { ok: false, error: 'Supabase не настроен' };
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function togglePublished(id: string, published: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminClient();
  if (!supabase) return { ok: false, error: 'Supabase не настроен' };
  const { error } = await supabase.from('reviews').update({ published }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
