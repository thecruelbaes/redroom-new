'use client';

import { useEffect, useState } from 'react';
import Logo from './Logo';

const LINKS = [
  { href: '#services', label: 'Уроки' },
  { href: '#teachers', label: 'Преподаватели' },
  { href: '#studio', label: 'Студия' },
  { href: '#reviews', label: 'Отзывы' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-obsidian/85 backdrop-blur-xl border-b border-white/8'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <a href="#home" aria-label="RedRoom Studio — на главную">
          <Logo />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-ink cursor-pointer"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#trial"
            className="btn-red hidden rounded-xl px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white md:inline-block cursor-pointer"
          >
            Пробное занятие
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            className="flex h-11 w-11 items-center justify-center rounded-lg hairline text-ink lg:hidden cursor-pointer"
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-current transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-6 bg-current transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-6 bg-current transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ${open ? 'max-h-[420px]' : 'max-h-0'}`}>
        <div className="border-t border-white/8 bg-obsidian/95 px-5 py-4 backdrop-blur-xl">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-muted hover:bg-white/5 hover:text-ink cursor-pointer"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#trial"
            onClick={() => setOpen(false)}
            className="btn-red mt-3 block rounded-xl px-5 py-3 text-center font-display font-semibold uppercase text-white cursor-pointer"
          >
            Пробное занятие бесплатно
          </a>
        </div>
      </div>
    </header>
  );
}
