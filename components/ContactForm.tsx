'use client';

import { useState } from 'react';
import { SITE, SERVICES } from '@/lib/content';
import { Telegram, Check, ArrowRight } from './Icons';

type Status = 'idle' | 'sending' | 'ok' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [consent, setConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent || status === 'sending') return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // honeypot
    if (data.company) return;

    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          service: data.service,
          comment: data.comment,
        }),
      });
      const json = await res.json().catch(() => ({}));
      // warning (например, telegram_not_configured) значит, что HTTP 200, но заявка
      // никуда реально не улетела — не показываем ложный успех.
      if (!res.ok || json?.warning) throw new Error(json?.error || 'fail');
      setStatus('ok');
      // Цель для Яндекс.Директа/Метрики — по этому же событию строятся автостратегии.
      window.ym?.(Number(SITE.yandexMetrikaId), 'reachGoal', 'lead_submit');
      form.reset();
      setConsent(false);
    } catch {
      setStatus('error');
      setErrorMsg('Не удалось отправить. Напишите нам в Telegram — мы на связи.');
    }
  }

  return (
    <section id="contact" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        {/* left: pitch + contacts */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-red" />
            <span className="font-display text-xs font-semibold uppercase tracking-mega text-red">
              Заявка
            </span>
          </div>
          <h2 className="font-display text-4xl font-bold leading-[1.02] md:text-5xl">
            Запишись на <span className="text-flame">бесплатное</span> занятие
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Оставь номер — перезвоним, расскажем про программу и цены, подберём преподавателя и удобное
            время. Первое занятие бесплатно и ни к чему не обязывает.
          </p>
          <p className="mt-3 max-w-md text-sm italic leading-relaxed text-faint">
            Не стесняйся: даже самые крутые барабанщики когда-то не знали, как держать палочки.
          </p>

          <div className="mt-9 space-y-4">
            <a
              href={SITE.phones[0].href}
              className="flex items-center gap-3 font-display text-xl font-semibold text-ink transition-colors hover:text-red cursor-pointer"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-surface text-red">
                <PhoneSmall />
              </span>
              {SITE.phones[0].display}
            </a>
            <a
              href={SITE.telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 font-display text-xl font-semibold text-ink transition-colors hover:text-red cursor-pointer"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-surface text-red">
                <Telegram className="h-5 w-5" />
              </span>
              {SITE.telegramChannelHandle}
            </a>
          </div>

          <div className="mt-8 space-y-1 text-sm text-faint">
            <p>
              <a
                href={SITE.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-muted cursor-pointer"
              >
                {SITE.address}
              </a>
            </p>
            <p>{SITE.workHours}</p>
            <p>
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-muted cursor-pointer">
                {SITE.email}
              </a>
            </p>
          </div>
        </div>

        {/* right: form */}
        <div className="rounded-3xl hairline-strong bg-surface/80 p-6 backdrop-blur-sm md:p-9">
          {status === 'ok' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full btn-red text-white">
                <Check className="h-8 w-8" />
              </span>
              <h3 className="font-display text-2xl font-bold text-ink">Заявка принята</h3>
              <p className="mt-3 max-w-xs text-sm text-muted">
                Свяжемся с тобой в ближайшее время. До встречи в RedRoom!
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-6 text-sm text-muted underline-offset-4 hover:underline cursor-pointer"
              >
                Отправить ещё одну
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {/* honeypot */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

              <Field label="Как тебя зовут" htmlFor="name">
                <input id="name" name="name" required autoComplete="name" placeholder="Имя" className={inputCls} />
              </Field>

              <Field label="Телефон" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+7 (___) ___-__-__"
                  className={inputCls}
                />
              </Field>

              <Field label="Направление" htmlFor="service">
                <select id="service" name="service" defaultValue="" className={`${inputCls} appearance-none`}>
                  <option value="" disabled>
                    Выбери направление
                  </option>
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.title} className="bg-obsidian">
                      {s.title}
                    </option>
                  ))}
                  <option value="Другое" className="bg-obsidian">
                    Другое
                  </option>
                </select>
              </Field>

              <Field label="Комментарий" htmlFor="comment" optional>
                <textarea
                  id="comment"
                  name="comment"
                  rows={3}
                  placeholder="Уровень, пожелания, удобное время"
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-faint">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-red"
                />
                <span>
                  Я согласен на обработку{' '}
                  <a href="/privacy" target="_blank" className="text-muted underline-offset-2 hover:underline">
                    персональных данных
                  </a>{' '}
                  в соответствии с 152-ФЗ.
                </span>
              </label>

              {status === 'error' && (
                <p className="text-sm text-red-bright" role="alert">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={!consent || status === 'sending'}
                className="btn-red group flex w-full items-center justify-center gap-2 rounded-xl px-7 py-4 font-display text-base font-semibold uppercase tracking-wide text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                {status !== 'sending' && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-obsidian/70 px-4 py-3.5 text-[15px] text-white placeholder:text-faint outline-none transition-colors focus:border-red/60 focus:ring-2 focus:ring-red/15';

function Field({
  label,
  htmlFor,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
        {label} {optional && <span className="text-faint normal-case">— по желанию</span>}
      </label>
      {children}
    </div>
  );
}

function PhoneSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
