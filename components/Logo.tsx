import Image from 'next/image';
import { SITE } from '@/lib/content';

export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex-none" style={{ height: size, width: size }}>
        <Image
          src="/images/logo-mark.png"
          alt={`Логотип ${SITE.name}`}
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority
        />
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-wide2 text-ink">
          {SITE.shortName}
        </span>
        <span className="block text-[10px] tracking-mega text-red">{SITE.sub}</span>
      </span>
    </span>
  );
}
