import Image from 'next/image';
import { GALLERY } from '@/lib/content';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Studio() {
  return (
    <section id="studio" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Студия"
          title={<>Наша студия</>}
          sub="Класс для уроков, репетиционная точка и уголок звукозаписи — всё под одной крышей. Живые инструменты и пространство, где хочется задерживаться подольше."
        />

        <div className="mt-14 grid auto-rows-[220px] grid-cols-2 gap-4 md:grid-cols-4">
          {GALLERY.map((g, i) => (
            <Reveal
              key={g.src}
              delay={(i % 4) * 60}
              className={i === 0 || i === 3 ? 'col-span-2 row-span-1' : ''}
            >
              <div className="group relative h-full w-full overflow-hidden rounded-2xl hairline">
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
