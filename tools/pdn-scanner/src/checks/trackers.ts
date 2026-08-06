/**
 * Счётчики, трекеры и cookie-баннер (CK-*).
 *
 * Тон этих проверок изменён после правовой сверки.
 *
 * Спецификация считала иностранный счётчик «самым дорогим пунктом» и обвиняла
 * в трансграничной передаче со ссылкой на ч. 8 ст. 13.11 и суммой до 6 млн.
 * Проверка это не подтвердила: ч. 8 — про локализацию, а отдельного состава
 * за трансграничную передачу в КоАП нет (см. CROSS_BORDER в legal.ts).
 *
 * Поэтому иностранный счётчик здесь — НЕ нарушение, а признак. Он не даёт
 * severity и не идёт в письмо как обвинение. Его роль — вопрос клиенту о том,
 * где хранятся данные, из которого уже выходит локализация с настоящей суммой.
 *
 * Отсутствие cookie-баннера тоже не нарушение: прямой нормы, обязывающей
 * его показывать, в 152-ФЗ нет. Это рекомендация, и только.
 */

import type { Page } from 'playwright';
import { type CheckResult, fail, na, pass, unknown } from '../types.js';

/** Иностранные аналитические и рекламные сервисы. */
const FOREIGN_TRACKERS: readonly (readonly [pattern: string, name: string])[] = [
  ['google-analytics.com', 'Google Analytics'],
  ['googletagmanager.com', 'Google Tag Manager'],
  ['doubleclick.net', 'Google DoubleClick'],
  ['connect.facebook.net', 'Meta Pixel'],
  ['facebook.com/tr', 'Meta Pixel'],
  ['hotjar.com', 'Hotjar'],
  ['clarity.ms', 'Microsoft Clarity'],
  ['analytics.tiktok.com', 'TikTok Pixel'],
  ['snap.licdn.com', 'LinkedIn Insight'],
  ['static.ads-twitter.com', 'X Pixel'],
  ['amplitude.com', 'Amplitude'],
  ['mixpanel.com', 'Mixpanel'],
  ['segment.io', 'Segment'],
  ['sentry.io', 'Sentry'],
  ['intercom.io', 'Intercom'],
];

/** Российские счётчики — упоминаются как факт, нарушением не являются. */
const RU_TRACKERS: readonly (readonly [pattern: string, name: string])[] = [
  ['mc.yandex.ru', 'Яндекс.Метрика'],
  ['top-mail.ru', 'Top.Mail.Ru'],
  ['top100.rambler.ru', 'Rambler Top100'],
  ['vk.com/rtrg', 'VK Пиксель'],
  ['vk.ru/rtrg', 'VK Пиксель'],
  ['roistat.com', 'Roistat'],
  ['calltouch.ru', 'Calltouch'],
  ['bitrix24.ru', 'Битрикс24'],
  ['amocrm.ru', 'amoCRM'],
  ['jivo.ru', 'Jivo'],
  ['jivosite.com', 'Jivo'],
];

const match = (
  hosts: readonly string[],
  urls: readonly string[],
  table: readonly (readonly [string, string])[],
): { name: string; host: string }[] => {
  const found = new Map<string, string>();
  for (const [pattern, name] of table) {
    const hit =
      hosts.find((h) => h === pattern || h.endsWith(`.${pattern}`) || h.includes(pattern.split('/')[0])) ??
      urls.find((u) => u.includes(pattern));
    if (hit) found.set(name, hit);
  }
  return [...found].map(([name, host]) => ({ name, host }));
};

interface BannerInfo {
  readonly present: boolean;
  readonly hasLink: boolean;
  readonly text: string;
}

async function detectCookieBanner(page: Page): Promise<BannerInfo> {
  return page.evaluate(() => {
    const KEYWORD = /(cookie|куки|файлы cookie)/i;
    const ACCEPT = /(принять|согласен|соглаша|хорошо|ок|accept|понятно|разреш)/i;

    const candidates = [...document.querySelectorAll('div, section, aside, dialog, footer')];
    for (const el of candidates) {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      // Баннер — короткий блок: длинный текст почти всегда вся страница целиком.
      if (text.length > 600 || text.length < 20) continue;
      if (!KEYWORD.test(text)) continue;

      const hasButton = [...el.querySelectorAll('button, a, [role="button"]')].some((b) =>
        ACCEPT.test(b.textContent ?? ''),
      );
      if (!hasButton) continue;

      return { present: true, hasLink: !!el.querySelector('a[href]'), text: text.slice(0, 300) };
    }
    return { present: false, hasLink: false, text: '' };
  });
}

export async function runTrackerChecks(
  page: Page,
  externalHosts: readonly string[],
  externalUrls: readonly string[],
): Promise<CheckResult[]> {
  const out: CheckResult[] = [];

  let banner: BannerInfo;
  try {
    banner = await detectCookieBanner(page);
  } catch (e) {
    banner = { present: false, hasLink: false, text: '' };
    out.push(unknown('CK-01', 'Cookie-баннер', `Не удалось проверить: ${String(e)}`));
  }

  const foreign = match(externalHosts, externalUrls, FOREIGN_TRACKERS);
  const russian = match(externalHosts, externalUrls, RU_TRACKERS);

  // CK-01 — баннер. Не нарушение: прямой нормы нет, только рекомендация.
  if (!out.some((c) => c.id === 'CK-01')) {
    out.push(
      banner.present
        ? pass('CK-01', 'Cookie-баннер', 'Баннер информирования найден', [
            { kind: 'note', value: banner.text },
          ])
        : pass(
            'CK-01',
            'Cookie-баннер',
            'Баннер не найден. Это рекомендация, а не нарушение: нормы, прямо обязывающей ' +
              'показывать cookie-баннер, в 152-ФЗ нет. В отчёте — только в замечаниях, без ссылки на закон.',
          ),
    );
  }

  // CK-02 — ссылка внутри баннера.
  out.push(
    !banner.present
      ? na('CK-02', 'Ссылка на политику в cookie-баннере', 'Баннера нет')
      : banner.hasLink
        ? pass('CK-02', 'Ссылка на политику в cookie-баннере', 'В баннере есть ссылка')
        : fail(
            'CK-02',
            'Ссылка на политику в cookie-баннере',
            'low',
            'Баннер информирует о cookie, но не ведёт ни на один документ.',
            [],
            [{ kind: 'note', value: banner.text }],
          ),
  );

  // CK-03 — счётчики стартуют до согласия.
  // Одного прохода достаточно: если баннер есть, а трекеры уже отработали
  // без единого клика — согласие не спрашивают, а имитируют.
  const trackersFired = foreign.length + russian.length > 0;
  out.push(
    !banner.present
      ? na('CK-03', 'Счётчики не стартуют до согласия', 'Баннера согласия нет — сравнивать не с чем')
      : !trackersFired
        ? pass('CK-03', 'Счётчики не стартуют до согласия', 'Трекеры до взаимодействия не обнаружены')
        : fail(
            'CK-03',
            'Счётчики не стартуют до согласия',
            // Severity 'low' намеренно: отдельной нормы за это нет (см. COOKIE_NOTICE),
            // поэтому пункт не должен весить в скоринге и не идёт в первое письмо.
            // Место такой находки — раздел замечаний отчёта.
            'low',
            `Баннер показан, но ${foreign.length + russian.length} трекер(ов) загрузились ` +
              'до какого-либо взаимодействия с ним — согласие запрашивается формально. ' +
              'Отдельной нормы, наказывающей именно за это, нет: пункт идёт в замечания, ' +
              'а не в перечень нарушений.',
            [],
            [{ kind: 'hosts', value: [...foreign, ...russian].map((f) => f.name).join(', ') }],
          ),
  );

  // CK-04 — иностранные счётчики. ПРИЗНАК, НЕ ОБВИНЕНИЕ.
  out.push(
    foreign.length === 0
      ? pass('CK-04', 'Иностранные счётчики и трекеры', 'Иностранных счётчиков не обнаружено')
      : {
          id: 'CK-04',
          title: 'Иностранные счётчики и трекеры',
          // Намеренно 'unknown', а не 'fail': сам по себе факт состава не образует.
          status: 'unknown',
          reason:
            `Обнаружены иностранные сервисы: ${foreign.map((f) => f.name).join(', ')}. ` +
            'Это НЕ нарушение само по себе и в письмо как обвинение не идёт. ' +
            'Вопрос, который отсюда следует: где хранятся данные, собранные этими сервисами, ' +
            'и данные форм — от ответа зависит применимость требования о локализации.',
          evidence: [{ kind: 'hosts', value: foreign.map((f) => `${f.name} (${f.host})`).join(', ') }],
          legal: [],
        },
  );

  // CK-05 — российские счётчики, справочно.
  out.push(
    pass(
      'CK-05',
      'Российские счётчики',
      russian.length > 0
        ? `Обнаружены: ${russian.map((r) => r.name).join(', ')}`
        : 'Российских счётчиков не обнаружено',
      russian.length > 0 ? [{ kind: 'hosts', value: russian.map((r) => r.host).join(', ') }] : [],
    ),
  );

  return out;
}

/** Экспортируется для INF-05 — там же ищем зарубежные приёмники форм. */
export const FOREIGN_FORM_ENDPOINTS: readonly (readonly [string, string])[] = [
  ['formspree.io', 'Formspree'],
  ['getform.io', 'Getform'],
  ['formcarry.com', 'Formcarry'],
  ['api.hsforms.com', 'HubSpot Forms'],
  ['forms.gle', 'Google Forms'],
  ['docs.google.com/forms', 'Google Forms'],
  ['api.mailchimp.com', 'Mailchimp'],
  ['list-manage.com', 'Mailchimp'],
  ['api.sendgrid.com', 'SendGrid'],
  ['typeform.com', 'Typeform'],
  ['airtable.com', 'Airtable'],
  ['api.telegram.org', 'Telegram Bot API'],
];
