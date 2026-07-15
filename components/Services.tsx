import Image from 'next/image';
import { SERVICES } from '@/lib/content';
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
          sub="Фокус — на индивидуальных уроках барабанов и гитары. А ещё у нас есть репетиционная точка и студия звукозаписи."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <Reveal key={s.id} delay={i * 70}>
                <article
                  className={`glow-card group relative h-full overflow-hidden rounded-2xl ${
                    s.flagship ? 'border border-red/40' : 'hairline'
                  } bg-surface`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                    <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-obsidian/70 text-red backdrop-blur-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                    {s.flagship && (
                      <span className="absolute right-4 top-4 rounded-full bg-red px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Флагман
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
