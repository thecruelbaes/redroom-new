import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Страница не найдена',
  robots: { index: false, follow: true },
};

// Брендированная 404 — на случай, если кто-то придёт по устаревшей ссылке
// (старая поисковая выдача Tilda-сайта, сайтлинк рекламы, закладка). Мягко
// возвращает на главную, а не пугает голой английской ошибкой Next.js.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-20 text-center md:px-8">
      <p className="font-display text-7xl font-bold text-flame md:text-8xl">404</p>
      <h1 className="mt-6 font-display text-2xl font-bold uppercase text-ink md:text-3xl">
        Такой страницы нет
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        Возможно, ссылка устарела или в адресе опечатка. Но мы на месте — уроки барабанов и гитары,
        репетиции и запись в Новороссийске. Вернись на главную и запишись на бесплатное занятие.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="btn-red inline-flex items-center justify-center rounded-xl px-7 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-white cursor-pointer"
        >
          На главную
        </Link>
        <Link
          href="/#contact"
          className="inline-flex items-center justify-center rounded-xl hairline-strong bg-white/5 px-7 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-ink backdrop-blur-sm transition-colors hover:bg-white/10 cursor-pointer"
        >
          Записаться на занятие
        </Link>
      </div>
    </main>
  );
}
