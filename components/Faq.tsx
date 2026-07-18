import { FAQ } from '@/lib/content';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Faq() {
  return (
    <section id="faq" className="relative py-24 md:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SectionHeading
          center
          eyebrow="Вопросы"
          title={<>Частые вопросы</>}
          sub="Собрали то, что спрашивают чаще всего, — чтобы было проще решиться."
        />

        <div className="mt-12 space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 50}>
              <details className="group rounded-2xl hairline bg-surface transition-colors open:border-red/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                  <span className="font-display text-base font-semibold text-ink md:text-lg">
                    {f.q}
                  </span>
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-red/15 text-red transition-transform duration-300 group-open:rotate-45">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      className="h-4 w-4"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
