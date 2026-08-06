/**
 * Документы: политика обработки ПДн и согласие (DOC-*).
 *
 * Здесь чаще всего рождается ложное срабатывание, которое убивает разговор:
 * написать «у вас нет политики» человеку, у которого она есть, — это конец
 * переписки. Поэтому детекция ссылки идёт по широкому набору формулировок,
 * а любая неудача чтения документа даёт UNKNOWN, а не обвинение.
 */

import type { Page } from 'playwright';
import { type CheckResult, fail, na, pass, unknown } from '../types.js';

/** Формулировки ссылки на политику — намеренно широкие. */
const POLICY_LINK =
  /(политик|конфиденциальн|персональн[ыо]|обработк[аи]\s+данных|privacy|personal-?data|pdn|policy)/i;

/** Отдельный документ «Согласие на обработку». */
const CONSENT_DOC = /(согласие\s+на\s+обработк|соглашение\s+об\s+обработк|user-?agreement|consent)/i;

/**
 * Реквизиты оператора. Без \b: в JavaScript это ASCII-граница слова,
 * и с кириллицей она не срабатывает — «ИНН» после пробела не находился вовсе.
 * ОГРНИП стоит раньше ОГРН, иначе более длинный вариант никогда не совпадёт.
 */
const INN_OGRN = /(?:^|[^А-Яа-яЁёA-Za-z])(ИНН|ОГРНИП|ОГРН)[\s:—–-]*(\d[\d\s]{8,17})/iu;

/** Дата редакции: «от 01.02.2024», «редакция от 1 февраля 2024», «2024 г.» */
const POLICY_DATE =
  /(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})|(\d{1,2}\s+(январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)\w*\s+\d{4})/i;

interface FoundLink {
  readonly href: string;
  readonly text: string;
  readonly inFooterOrHeader: boolean;
}

async function findDocumentLinks(page: Page, source: string): Promise<FoundLink[]> {
  return page.evaluate((reSource) => {
    const re = new RegExp(reSource, 'i');
    const out: { href: string; text: string; inFooterOrHeader: boolean }[] = [];
    for (const a of document.querySelectorAll('a[href]')) {
      const el = a as HTMLAnchorElement;
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      const href = el.getAttribute('href') ?? '';
      if (!re.test(text) && !re.test(href)) continue;
      if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
      out.push({
        href: el.href,
        text: text.slice(0, 120),
        inFooterOrHeader: !!el.closest('footer, header, nav'),
      });
    }
    return out;
  }, source);
}

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export async function runDocumentChecks(page: Page): Promise<CheckResult[]> {
  const out: CheckResult[] = [];

  let links: FoundLink[];
  try {
    links = await findDocumentLinks(page, POLICY_LINK.source);
  } catch (e) {
    return [unknown('DOC-01', 'Ссылка на политику обработки ПДн', `Не удалось разобрать DOM: ${String(e)}`)];
  }

  const consentLinks = links.filter((l) => CONSENT_DOC.test(l.text) || CONSENT_DOC.test(l.href));
  const policyLinks = links.filter((l) => !consentLinks.includes(l));

  // DOC-01 — есть ли ссылка вообще.
  if (policyLinks.length === 0) {
    out.push(
      fail(
        'DOC-01',
        'Ссылка на политику обработки ПДн',
        'critical',
        'На главной странице не найдено ни одной ссылки на политику обработки персональных данных.',
        ['POLICY_PUBLISHED'],
      ),
    );
    for (const [id, title] of [
      ['DOC-02', 'Страница политики открывается'],
      ['DOC-03', 'Политика доступна с главной'],
      ['DOC-04', 'В политике указан оператор'],
      ['DOC-06', 'Указана дата редакции политики'],
    ] as const) {
      out.push(na(id, title, 'Ссылка на политику не найдена'));
    }
  } else {
    const primary = policyLinks[0];
    out.push(
      pass('DOC-01', 'Ссылка на политику обработки ПДн', `Найдена ссылка: «${primary.text}»`, [
        { kind: 'url', value: primary.href },
      ]),
    );

    // DOC-03 — доступность с главной, не глубже одного клика.
    out.push(
      policyLinks.some((l) => l.inFooterOrHeader)
        ? pass('DOC-03', 'Политика доступна с главной', 'Ссылка находится в шапке или подвале')
        : pass(
            'DOC-03',
            'Политика доступна с главной',
            'Ссылка есть на главной, но вне шапки и подвала — формально требование выполнено',
          ),
    );

    // DOC-02 — документ реально открывается.
    let body = '';
    try {
      const res = await page.context().request.get(primary.href, { timeout: 20_000 });
      if (res.ok()) {
        body = stripHtml(await res.text());
        out.push(
          pass('DOC-02', 'Страница политики открывается', `HTTP ${res.status()}`, [
            { kind: 'url', value: primary.href },
          ]),
        );
      } else {
        out.push(
          fail(
            'DOC-02',
            'Страница политики открывается',
            'critical',
            `Ссылка на политику есть, но документ не открывается: HTTP ${res.status()}. ` +
              'Фактически документ в открытом доступе отсутствует.',
            ['POLICY_PUBLISHED'],
            [{ kind: 'url', value: primary.href }],
          ),
        );
      }
    } catch (e) {
      out.push(
        unknown('DOC-02', 'Страница политики открывается', `Запрос не удался: ${String(e)}`, [
          { kind: 'url', value: primary.href },
        ]),
      );
    }

    // DOC-04 / DOC-06 — только если текст документа получен.
    if (!body) {
      out.push(unknown('DOC-04', 'В политике указан оператор', 'Текст документа не получен'));
      out.push(unknown('DOC-06', 'Указана дата редакции политики', 'Текст документа не получен'));
    } else {
      const inn = body.match(INN_OGRN);
      out.push(
        inn
          ? pass('DOC-04', 'В политике указан оператор', `Реквизиты найдены: ${inn[1]} ${inn[2].trim()}`)
          : fail(
              'DOC-04',
              'В политике указан оператор',
              'medium',
              'В тексте политики не найдены ИНН или ОГРН оператора — ' +
                'из документа нельзя однозначно установить, кто обрабатывает данные.',
              [],
            ),
      );

      const date = body.match(POLICY_DATE);
      out.push(
        date
          ? pass('DOC-06', 'Указана дата редакции политики', `Найдена дата: ${date[0]}`)
          : fail(
              'DOC-06',
              'Указана дата редакции политики',
              'low',
              'В политике не указана дата утверждения или редакции.',
              [],
            ),
      );
    }
  }

  // DOC-05 — отдельный документ согласия.
  out.push(
    consentLinks.length > 0
      ? pass('DOC-05', 'Отдельный документ «Согласие на обработку ПДн»', `Найден: «${consentLinks[0].text}»`, [
          { kind: 'url', value: consentLinks[0].href },
        ])
      : pass(
          'DOC-05',
          'Отдельный документ «Согласие на обработку ПДн»',
          'Отдельного документа согласия нет. Само по себе нарушением не является: ' +
            'закон не требует именно отдельного файла, если согласие корректно оформлено в форме.',
        ),
  );

  return out;
}
