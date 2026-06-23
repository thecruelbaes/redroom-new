import { SITE } from '@/lib/content';
import { Telegram } from './Icons';
import Reveal from './Reveal';

export default function TrialCta() {
  return (
    <section id="trial" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-red-glow" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full hairline-strong bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wide2 text-muted backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red" />
            Специальное предложение
          </span>
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.02] md:text-6xl">
            Первое занятие — <span className="text-flame">бесплатно</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Подпишись на наш Telegram-канал{' '}
            <span className="font-semibold text-ink">{SITE.telegramChannelHandle}</span> — и приходи
            на пробный урок по барабанам или гитаре. Без оплаты и обязательств: просто попробуй.
          </p>
          <a
            href={SITE.telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-red mt-9 inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-4 font-display text-base font-semibold uppercase tracking-wide text-white cursor-pointer"
          >
            <Telegram className="h-5 w-5" />
            Перейти в канал
          </a>
          <p className="mt-4 text-sm text-faint">{SITE.telegramChannel.replace('https://', '')}</p>
        </Reveal>
      </div>
    </section>
  );
}
