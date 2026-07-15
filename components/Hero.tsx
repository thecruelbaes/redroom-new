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
          className="object-cover object-[57%_center] md:object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian/55 via-obsidian/80 to-obsidian" />
      <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/55 to-transparent" />
      <div className="absolute inset-0 bg-grid opacity-50" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-start px-5 pt-28 pb-20 md:justify-center md:px-8">
        <div className="max-w-3xl">
          <p className="mb-6 font-display text-sm font-semibold uppercase tracking-mega text-muted">
            {SITE.tagline}
          </p>

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
                <span className="font-semibold">Первое занятие — бесплатно.</span> Оставь заявку — подберём
                преподавателя и удобное время, расскажем про программу. Без оплаты и обязательств.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="btn-red group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-white cursor-pointer"
              >
                Записаться на бесплатное занятие
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={SITE.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl hairline-strong bg-white/5 px-6 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-ink backdrop-blur-sm transition-colors duration-200 hover:bg-white/10 cursor-pointer"
              >
                <Telegram className="h-5 w-5" />
                Telegram-канал
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
