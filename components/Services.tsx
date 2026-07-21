import Image from 'next/image';
import { SERVICES, WHAT_ELSE } from '@/lib/content';
import { ICONS } from './Icons';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-stage-glow opacity-60" />
      {/* мягкая растушёвка сверху — убирает резкий стык с hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-obsidian to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Направления"
          title={<>Чему мы учим</>}
          sub="Главное — индивидуальные уроки барабанов и гитары, с первого занятия и на твоих любимых песнях."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <Reveal key={s.id} delay={i * 70}>
                <article className="glow-card group relative h-full overflow-hidden rounded-2xl border border-red/40 bg-surface">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                    <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-obsidian/70 text-red backdrop-blur-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Что ещё в студии — репточка и звукозапись, лёгким блоком под уроками, чтобы не спорить с ними за фокус */}
        <div className="mt-16">
          <h3 className="font-display text-sm font-semibold uppercase tracking-mega text-muted">
            Что ещё в студии
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {WHAT_ELSE.map((s, i) => {
              const Icon = ICONS[s.icon];
              return (
                <Reveal key={s.id} delay={i * 70}>
                  <article className="flex gap-4 rounded-2xl hairline bg-surface/60 p-5">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-red/10 text-red">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-display text-base font-semibold text-ink">{s.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{s.desc}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
