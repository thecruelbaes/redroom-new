'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { SITE } from '@/lib/content';
import { ArrowRight, Telegram, Spark } from './Icons';

export default function Hero() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(window.scrollY * 0.25));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="home" className="relative min-h-[100svh] overflow-hidden noise">
      {/* parallax background */}
      <div className="absolute inset-0 -z-10" style={{ transform: `translateY(${offset}px)` }}>
        <Image
          src="/images/hero-guitar.jpg"
          alt="Гитарист на сцене RedRoom Studio в красно-фиолетовом свете"
          fill
          priority
          quality={86}
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian/55 via-obsidian/80 to-obsidian" />
      <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/55 to-transparent" />
      <div className="absolute inset-0 bg-grid opacity-50" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-start px-5 pt-28 pb-20 md:justify-center md:px-8">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full hairline bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red" />
            <span className="text-xs font-medium uppercase tracking-wide2 text-muted">
              {SITE.tagline}
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[0.98] sm:text-5xl md:text-6xl lg:text-7xl">
            Научим играть на{' '}
            <span className="text-flame">барабанах</span> и{' '}
            <span className="text-flame">гитаре</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
            Индивидуальные уроки в <span className="text-ink">Новороссийске</span> — для любого
            возраста и уровня. Живые инструменты, опытные преподаватели и атмосфера, в которой
            хочется играть.
          </p>

          {/* free-trial hook */}
          <div className="mt-8 max-w-xl rounded-2xl hairline-strong bg-surface/70 p-5 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-red/15 text-red">
                <Spark className="h-5 w-5" />
              </span>
              <p className="text-[15px] leading-relaxed text-ink">
                Подпишись на наш Telegram-канал{' '}
                <span className="font-semibold text-red">{SITE.telegramChannelHandle}</span> и
                получи <span className="font-semibold">первое занятие бесплатно</span>.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={SITE.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-red group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-white cursor-pointer"
              >
                <Telegram className="h-5 w-5" />
                Получить пробное
              </a>
              <a
                href="#trial"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl hairline-strong bg-white/5 px-6 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-ink backdrop-blur-sm transition-colors duration-200 hover:bg-white/10 cursor-pointer"
              >
                Записаться
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <a
        href="#services"
        aria-label="Прокрутить вниз"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-faint md:flex cursor-pointer"
      >
        <span className="text-[10px] uppercase tracking-mega">Листай</span>
        <span className="flex h-9 w-5 justify-center rounded-full border border-white/15 pt-1.5">
          <span className="h-2 w-1 animate-bounce rounded-full bg-red" />
        </span>
      </a>
    </section>
  );
}
