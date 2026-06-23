import Reveal from './Reveal';

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
};

export default function SectionHeading({ eyebrow, title, sub, center }: Props) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div className={`mb-4 flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        <span className="h-px w-8 bg-red" />
        <span className="font-display text-xs font-semibold uppercase tracking-mega text-red">
          {eyebrow}
        </span>
        {center && <span className="h-px w-8 bg-red" />}
      </div>
      <h2 className="font-display text-4xl font-bold leading-[1.05] md:text-5xl">{title}</h2>
      {sub && <p className="mt-5 text-base leading-relaxed text-muted">{sub}</p>}
    </Reveal>
  );
}
