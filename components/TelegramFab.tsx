'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/lib/content';

// Плавающий кружок Telegram: появляется при скролле, деликатно «показывает себя».
// Основная конверсия — форма/телефон; это вторичный канал, растим актив в канале.
export default function TelegramFab() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href={SITE.telegramChannel}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Наш Telegram-канал"
      title="Наш Telegram-канал"
      className={`tg-fab fixed right-5 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-300 cursor-pointer md:bottom-6 ${
        show
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-3 scale-90 opacity-0'
      }`}
    >
      {/* мягкое кольцо-пульс */}
      <span className="tg-pulse pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      {/* официальный знак Telegram (бумажный самолёт) */}
      <svg viewBox="0 0 24 24" fill="currentColor" className="relative h-7 w-7 -translate-x-[1px]">
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.9-.75 1.12-1.51.7L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
      </svg>
    </a>
  );
}
