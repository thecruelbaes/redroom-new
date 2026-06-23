'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/lib/content';
import { Telegram } from './Icons';

export default function FloatingCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href={SITE.telegramChannel}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Получить бесплатное пробное занятие в Telegram"
      className={`btn-red fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300 cursor-pointer md:hidden ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <Telegram className="h-5 w-5" />
      Пробное занятие
    </a>
  );
}
