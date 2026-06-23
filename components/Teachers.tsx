import Image from 'next/image';
import { TEACHERS } from '@/lib/content';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Teachers() {
  return (
    <section id="teachers" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-stage-glow opacity-50" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Преподаватели"
          title={<>Кто будет тебя учить</>}
          sub="Практикующие музыканты, которые играют на сцене и умеют объяснять. Занятия — на драйве, без скучной теории ради теории."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEACHERS.map((t, i) => (
            <Reveal key={t.id} delay={i * 80}>
              <article className="glow-card group relative h-full overflow-hidden rounded-2xl hairline bg-surface">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={t.image}
                    alt={`${t.name} — преподаватель (${t.instrument})`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5">
                    <span className="rounded-full bg-red px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                      {t.instrument}
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-bold text-ink">{t.name}</h3>
                  </div>
                </div>
                <p className="p-5 text-sm leading-relaxed text-muted">{t.bio}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
