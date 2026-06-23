import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function ArrowRight(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Phone(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

export function Check(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Telegram(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M21.5 4.3 2.9 11.4c-.9.4-.9 1.6 0 1.9l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.3l2.6-2.6 4.7 3.5c.6.4 1.4.1 1.6-.6L23 5.5c.2-.9-.7-1.6-1.5-1.2Z" />
      <path d="m8 14 9-6-6.5 7" />
    </svg>
  );
}

export function Drums(p: P) {
  return (
    <svg {...base} {...p}>
      <ellipse cx="12" cy="15" rx="7" ry="3.2" />
      <path d="M5 15v2.5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2V15" />
      <path d="m9 13 4.5-9M15 13 18 6" />
      <circle cx="13.6" cy="4" r="1" />
      <circle cx="18.3" cy="6" r="1" />
    </svg>
  );
}

export function Guitar(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="m19.5 3-1.6 1.6a2 2 0 0 0 0 2.8l-.7.7a2 2 0 0 0-2.6.2l-1 1a4 4 0 1 1-1.3-1.3l1-1a2 2 0 0 0 .2-2.6l.7-.7a2 2 0 0 0 2.8 0L20.4 2" />
      <circle cx="9" cy="15" r="2.4" />
    </svg>
  );
}

export function Mic(p: P) {
  return (
    <svg {...base} {...p}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
    </svg>
  );
}

export function Speaker(p: P) {
  return (
    <svg {...base} {...p}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="14" r="4" />
      <circle cx="12" cy="6" r="1" />
    </svg>
  );
}

export function Star(p: P) {
  return (
    <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...p}>
      <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7Z" />
    </svg>
  );
}

export function Spark(p: P) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

export const ICONS = {
  drums: Drums,
  guitar: Guitar,
  rehearsal: Speaker,
  record: Mic,
};
