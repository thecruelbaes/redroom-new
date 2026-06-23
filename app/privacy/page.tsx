import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных',
  description: 'Политика обработки персональных данных RedRoom Studio (152-ФЗ).',
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-20 md:px-8">
      <Link href="/" className="text-sm text-muted hover:text-ink cursor-pointer">
        ← На главную
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">
        Политика обработки персональных данных
      </h1>
      <p className="mt-3 text-sm text-faint">
        Действует для сайта {SITE.name}. Оператор: {SITE.legalEntity}, г. Новороссийск.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">1. Общие положения</h2>
          <p>
            Настоящая Политика определяет порядок обработки персональных данных и меры по обеспечению
            их безопасности в соответствии с Федеральным законом РФ от 27.07.2006 № 152-ФЗ «О
            персональных данных». Оставляя заявку на сайте, пользователь подтверждает согласие с
            условиями данной Политики. Оператор персональных данных — {SITE.legalEntity}.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">2. Какие данные мы собираем</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>имя (как к вам обращаться);</li>
            <li>номер телефона;</li>
            <li>выбранное направление и комментарий к заявке (по желанию).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">3. Цели обработки</h2>
          <p>
            Данные используются исключительно для обратной связи по заявке: консультации, записи на
            пробное и регулярные занятия, согласования времени. Мы не передаём данные третьим лицам и
            не используем их для рассылок без отдельного согласия.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">4. Правовое основание</h2>
          <p>
            Обработка осуществляется на основании согласия субъекта персональных данных, которое он
            даёт, проставляя отметку в форме заявки.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">5. Хранение и защита</h2>
          <p>
            Данные передаются по защищённому каналу и хранятся не дольше, чем это необходимо для целей
            обработки. Принимаются организационные и технические меры для защиты от
            несанкционированного доступа.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">6. Права пользователя</h2>
          <p>
            Пользователь вправе в любой момент отозвать согласие на обработку персональных данных,
            запросить их изменение или удаление, обратившись по телефону{' '}
            <a href={SITE.phones[0].href} className="text-ink hover:underline">
              {SITE.phones[0].display}
            </a>{' '}
            или в Telegram{' '}
            <a href={SITE.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">
              {SITE.telegramChannelHandle}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">7. Контакты</h2>
          <p>
            По вопросам обработки персональных данных: {SITE.legalEntity}, {SITE.phones[0].display},
            г. Новороссийск.
          </p>
        </section>

        <p className="border-t border-white/8 pt-6 text-xs text-faint">
          ⚠️ Шаблон. Перед публикацией дополните реквизитами ИП (ИНН, ОГРНИП, e-mail, юр. адрес) и при
          необходимости согласуйте с юристом.
        </p>
      </div>
    </main>
  );
}
