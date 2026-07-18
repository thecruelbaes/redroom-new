import { SITE, SERVICES } from '@/lib/content';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/8 bg-void">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo size={48} />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-faint">
              Школа музыки и студия в Новороссийске. Индивидуальные уроки барабанов и гитары,
              репетиционная точка, звукозапись.
            </p>
            <a
              href={SITE.telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full hairline px-4 py-2 text-xs font-semibold text-muted hover:bg-white/5 cursor-pointer"
            >
              Telegram {SITE.telegramChannelHandle}
            </a>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">Направления</h3>
            <ul className="mt-4 space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s.id}>
                  <a href="#services" className="text-sm text-faint transition-colors hover:text-muted cursor-pointer">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">Контакты</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href={SITE.phones[0].href} className="text-sm font-semibold text-muted hover:text-ink cursor-pointer">
                  {SITE.phones[0].display}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="text-sm text-faint transition-colors hover:text-muted cursor-pointer">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-faint transition-colors hover:text-muted cursor-pointer"
                >
                  {SITE.address}
                </a>
              </li>
              <li className="text-sm text-faint">{SITE.workHours}</li>
              <li>
                <a href="/privacy" className="text-sm text-faint hover:text-muted cursor-pointer">
                  Политика обработки персональных данных
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-6 text-xs text-faint md:flex-row">
          <p>© {year} {SITE.name}. {SITE.legalEntity}.</p>
          <p>г. Новороссийск · Уроки музыки</p>
        </div>
      </div>
    </footer>
  );
}
