-- ============================================================
-- RedRoom Studio — схема БД для отзывов (Supabase / Postgres)
-- Выполни ОДИН раз в Supabase: Dashboard → SQL Editor → Run.
-- ============================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  text        text not null,
  source      text not null default 'ученик',         -- в RedRoom это «роль/подпись»: 'ученица · барабаны' и т.п.
  rating      smallint not null default 5 check (rating between 1 and 5),
  published   boolean not null default true,
  sort_order  integer not null default 0,             -- больше = выше
  created_at  timestamptz not null default now()
);

create index if not exists reviews_published_idx
  on public.reviews (published, sort_order desc, created_at desc);

-- ===== Row Level Security =====
-- Публично (anon/publishable-ключ) можно ТОЛЬКО читать опубликованные.
-- Запись/удаление — только service_role (серверная админка), он обходит RLS.
alter table public.reviews enable row level security;

drop policy if exists "public read published reviews" on public.reviews;
create policy "public read published reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (published = true);

-- ===== Стартовые отзывы (перенос из статики; замени реальными из админки) =====
insert into public.reviews (name, text, source, rating, sort_order) values
  ('Анна',
   'Пришла с нуля, думала это не для меня. Через месяц уже играла первый ритм любимой песни. Преподаватель объясняет спокойно и по делу.',
   'ученица · барабаны', 5, 30),
  ('Дмитрий',
   'Брал индивидуальные занятия по электрогитаре. Программа реально под меня, разбираем то, что хочу играть. Атмосфера в студии огонь.',
   'ученик · гитара', 5, 20),
  ('Мария',
   'Сын ходит на барабаны и горит этим. Видно, что преподаватели любят своё дело. Записались после бесплатного пробного — не пожалели.',
   'мама ученика', 5, 10)
on conflict do nothing;
