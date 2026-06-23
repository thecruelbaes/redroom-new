import { ADVANTAGES, STATS } from '@/lib/content';
import { Check } from './Icons';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Why() {
  return (
    <section id="why" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading eyebrow="Почему RedRoom" title={<>Здесь начинают играть</>} />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a, i) => (
            <Reveal key={a.title} delay={i * 70}>
              <div className="glow-card h-full rounded-2xl hairline bg-surface p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red/15 text-red">
                  <Check className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* stats */}
        <Reveal>
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl hairline bg-white/8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-surface px-6 py-8 text-center">
                <div className="font-display text-4xl font-bold text-flame md:text-5xl">{s.value}</div>
                <div className="mt-2 text-xs uppercase tracking-wide2 text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
