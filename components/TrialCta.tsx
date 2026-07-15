import { SITE } from '@/lib/content';
import { Telegram, ArrowRight } from './Icons';
import Reveal from './Reveal';

export default function TrialCta() {
  return (
    <section id="trial" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-red-glow" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
        <Reveal>
          <p className="font-display text-sm font-semibold uppercase tracking-mega text-muted">
            Специальное предложение
          </p>
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.02] md:text-6xl">
            Первое занятие — <span className="text-flame">бесплатно</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Оставь заявку и приходи на пробный урок по барабанам или гитаре. Познакомишься с
            преподавателем, попробуешь инструмент вживую — без оплаты и обязательств.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="btn-red group inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-4 font-display text-base font-semibold uppercase tracking-wide text-white cursor-pointer"
            >
              Записаться на бесплатное занятие
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={SITE.telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl hairline-strong bg-white/5 px-6 py-4 font-display text-base font-semibold uppercase tracking-wide text-ink transition-colors duration-200 hover:bg-white/10 cursor-pointer"
            >
              <Telegram className="h-5 w-5" />
              Наш Telegram
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
