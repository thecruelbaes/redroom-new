import type { Metadata } from 'next';
import { isAuthed, usingDefaultCreds } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getAllReviews } from '@/lib/reviews';
import LoginForm from './LoginForm';
import AddReviewForm from './AddReviewForm';
import { logoutAction, deleteReviewAction, togglePublishAction } from './actions';

export const metadata: Metadata = {
  title: 'Админка',
  robots: { index: false, follow: false },
};

// Всегда динамически (читаем сессию + БД).
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAuthed())) {
    return <LoginForm />;
  }

  const reviews = await getAllReviews();

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-ink">Отзывы</h1>
          <p className="mt-1 text-sm text-faint">RedRoom Studio · админка</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-sm text-muted hover:text-ink cursor-pointer">
            Открыть сайт ↗
          </a>
          <form action={logoutAction}>
            <button className="rounded-full hairline px-4 py-2 text-sm text-muted hover:bg-white/5 cursor-pointer">
              Выйти
            </button>
          </form>
        </div>
      </div>

      {usingDefaultCreds && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          ⚠️ Используется пароль/секрет по умолчанию. Задай <code>ADMIN_PASSWORD</code> и{' '}
          <code>ADMIN_SESSION_SECRET</code> в <code>.env.local</code> перед публикацией.
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-2xl border border-red/30 bg-red/10 p-4 text-sm text-red-200">
          Supabase не подключён — отзывы не сохранятся. Заполни ключи в <code>.env.local</code> и
          выполни <code>supabase-schema.sql</code>. Сейчас сайт показывает резервные отзывы из кода.
        </div>
      )}

      <div className="mt-8">
        <AddReviewForm />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Все отзывы ({reviews.length})
        </h2>

        {reviews.length === 0 && (
          <p className="rounded-2xl hairline bg-surface/50 p-6 text-sm text-faint">
            Пока нет отзывов{isSupabaseConfigured ? '' : ' (подключите Supabase)'}.
          </p>
        )}

        {reviews.map((r) => (
          <article
            key={r.id}
            className={`rounded-2xl hairline bg-surface p-5 ${r.published ? '' : 'opacity-60'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold text-ink">{r.name}</span>
                  <span className="text-xs text-red">{'★'.repeat(r.rating)}</span>
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-muted">
                    {r.source}
                  </span>
                  {!r.published && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-200">
                      скрыт
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.text}</p>
              </div>

              <div className="flex flex-none gap-2">
                <form action={togglePublishAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="published" value={String(r.published)} />
                  <button className="rounded-lg hairline px-3 py-1.5 text-xs text-muted hover:bg-white/5 cursor-pointer">
                    {r.published ? 'Скрыть' : 'Показать'}
                  </button>
                </form>
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-lg border border-red/40 px-3 py-1.5 text-xs text-red hover:bg-red/10 cursor-pointer">
                    Удалить
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
