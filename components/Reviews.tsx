import { RATING_SUMMARY } from '@/lib/content';
import { getPublicReviews } from '@/lib/reviews';
import { Star } from './Icons';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default async function Reviews() {
  const reviews = await getPublicReviews();
  return (
    <section id="reviews" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Отзывы"
          title={<>Что говорят ученики</>}
          sub="Живые впечатления тех, кто уже занимается в RedRoom."
        />

        <Reveal>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl hairline bg-surface px-5 py-3">
            <div className="flex gap-0.5 text-red">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5" />
              ))}
            </div>
            <span className="font-display text-xl font-bold text-ink">{RATING_SUMMARY.score}</span>
            <span className="text-sm text-muted">{RATING_SUMMARY.label}</span>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={`${r.name}-${i}`} delay={i * 80}>
              <figure className="glow-card flex h-full flex-col rounded-2xl hairline bg-surface p-6">
                <div className="flex gap-0.5 text-red">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                  «{r.text}»
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/8 pt-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red/15 font-display text-lg font-bold text-red">
                    {r.name[0]}
                  </span>
                  <span>
                    <span className="block font-display text-sm font-semibold text-ink">{r.name}</span>
                    <span className="block text-xs text-faint">{r.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
