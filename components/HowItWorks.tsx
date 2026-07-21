import { HOW_IT_WORKS } from '@/lib/content';
import { ArrowRight } from './Icons';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-24 md:py-32">
      <div className="absolute inset-0 bg-red-glow opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Обучение"
          title={<>Этапы нашего обучения</>}
          sub="Путь от знакомства со студией до первого выступления на сцене."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <Reveal key={s.step} delay={i * 80}>
              <div className="glow-card relative h-full rounded-2xl hairline bg-surface p-7">
                <span className="font-display text-5xl font-bold text-flame md:text-6xl">
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <span className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-red/40 lg:block">
                    <ArrowRight className="h-6 w-6" />
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 text-center">
            <a
              href="#contact"
              className="btn-red group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 font-display text-base font-semibold uppercase tracking-wide text-white cursor-pointer"
            >
              Оставить заявку
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
