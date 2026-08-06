/**
 * Проверки форм сбора персональных данных (FRM-*).
 *
 * Два отличия от спецификации, оба — следствие ложных срабатываний.
 *
 * 1. Предотмеченность чекбокса нельзя определять через `defaultChecked`.
 *    `defaultChecked` отражает HTML-атрибут `checked`. Контролируемый
 *    React-чекбокс с начальным состоянием true имеет свойство checked === true
 *    и НИКАКОГО атрибута. То есть проверка молчала бы ровно на том случае,
 *    ради которого написана. Здесь читается живое свойство `checked` на момент
 *    отрисовки — оно совпадает с тем, что видит пользователь, а атрибут
 *    сохраняется отдельно, как улика.
 *
 * 2. Отсутствие атрибута `action` — не признак отправки на чужой домен.
 *    Формы на fetch/XHR (весь современный фронтенд) не имеют action вовсе.
 *    Наивное сравнение вернуло бы «форма уходит налево» для нормального сайта.
 *    Такой случай уходит в UNKNOWN и разрешается по сетевым запросам.
 */

import type { Page } from 'playwright';
import { type CheckResult, fail, na, pass, unknown } from '../types.js';

/** Поля, наличие которых делает форму сборщиком персональных данных. */
const PDN_FIELD = /(phone|tel|mobile|mail|email|name|fio|surname|телефон|почт|имя|фио)/i;

/** Формулировка согласия рядом с чекбоксом. */
const CONSENT_TEXT = /(соглас|обработк|персональн|политик|конфиденциальн)/i;

/** Тексты, по которым чекбокс опознаётся как подписка, а не как согласие на ПДн. */
const SUBSCRIPTION_TEXT = /(рассылк|новост|акци|подписк|маркетинг)/i;

interface RawCheckbox {
  readonly liveChecked: boolean;
  readonly hasCheckedAttr: boolean;
  readonly labelText: string;
  readonly labelHasLink: boolean;
  readonly required: boolean;
}

interface RawForm {
  /** true — настоящий <form>, false — контейнер-виджет без <form>. */
  readonly isNativeForm: boolean;
  readonly action: string | null;
  readonly hasPdnField: boolean;
  readonly fieldNames: readonly string[];
  readonly checkboxes: readonly RawCheckbox[];
  readonly outerHtmlSample: string;
}

/**
 * Достаёт формы из живого DOM. Ищет и обычные <form>, и контейнеры-виджеты,
 * у которых есть поля и кнопка отправки, но нет тега form (Tilda, React, чаты).
 */
async function extractForms(page: Page): Promise<RawForm[]> {
  return page.evaluate(
    ({ pdnSource, consentSource }) => {
      const pdnRe = new RegExp(pdnSource, 'i');
      const consentRe = new RegExp(consentSource, 'i');

      const describeCheckbox = (el: Element) => {
        const input = el as HTMLInputElement;
        const isNative = input.tagName === 'INPUT';
        const label =
          el.closest('label') ??
          (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null) ??
          el.parentElement;

        return {
          // Живое состояние — то, что видит пользователь. Работает и для React.
          liveChecked: isNative
            ? input.checked
            : el.getAttribute('aria-checked') === 'true',
          hasCheckedAttr: el.hasAttribute('checked'),
          labelText: (label?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
          labelHasLink: !!label?.querySelector('a[href]'),
          required: isNative ? input.required : el.getAttribute('aria-required') === 'true',
        };
      };

      const collectFields = (root: Element) =>
        [...root.querySelectorAll('input, textarea, select')]
          .filter((i) => {
            const t = (i as HTMLInputElement).type;
            return t !== 'hidden' && t !== 'submit' && t !== 'button';
          })
          .map((i) => {
            const el = i as HTMLInputElement;
            return [el.name, el.id, el.placeholder, el.type, el.autocomplete]
              .filter(Boolean)
              .join(' ');
          });

      const collectCheckboxes = (root: Element) =>
        [
          ...root.querySelectorAll('input[type="checkbox"], [role="checkbox"]'),
        ].map(describeCheckbox);

      const results: RawForm[] = [];
      const seen = new Set<Element>();

      for (const form of document.querySelectorAll('form')) {
        seen.add(form);
        const fields = collectFields(form);
        results.push({
          isNativeForm: true,
          action: form.getAttribute('action'),
          hasPdnField: fields.some((f) => pdnRe.test(f)),
          fieldNames: fields,
          checkboxes: collectCheckboxes(form),
          outerHtmlSample: form.outerHTML.slice(0, 1500),
        });
      }

      // Виджеты без <form>: берём ближайшего общего предка полей и кнопки.
      const submitLike = [...document.querySelectorAll('button, [role="button"], input[type="submit"]')];
      for (const btn of submitLike) {
        let container: Element | null = btn.parentElement;
        for (let depth = 0; depth < 5 && container; depth++) {
          if ([...seen].some((f) => f.contains(container as Node))) break;
          const fields = collectFields(container);
          if (fields.length >= 2 && fields.some((f) => pdnRe.test(f))) {
            if (!seen.has(container)) {
              seen.add(container);
              results.push({
                isNativeForm: false,
                action: null,
                hasPdnField: true,
                fieldNames: fields,
                checkboxes: collectCheckboxes(container),
                outerHtmlSample: container.outerHTML.slice(0, 1500),
              });
            }
            break;
          }
          container = container.parentElement;
        }
      }

      // Помечаем чекбоксы согласия — пригодится вызывающей стороне.
      void consentRe;
      return results;
    },
    { pdnSource: PDN_FIELD.source, consentSource: CONSENT_TEXT.source },
  );
}

const isConsentCheckbox = (c: RawCheckbox) =>
  CONSENT_TEXT.test(c.labelText) && !SUBSCRIPTION_TEXT.test(c.labelText);

export async function runFormChecks(
  page: Page,
  siteHost: string,
): Promise<CheckResult[]> {
  let forms: RawForm[];
  try {
    forms = await extractForms(page);
  } catch (e) {
    return [
      unknown('FRM-01', 'Формы сбора персональных данных', `Не удалось разобрать DOM: ${String(e)}`),
    ];
  }

  const pdnForms = forms.filter((f) => f.hasPdnField);
  const out: CheckResult[] = [];

  if (pdnForms.length === 0) {
    out.push(
      pass(
        'FRM-01',
        'Формы сбора персональных данных',
        forms.length === 0
          ? 'Формы на странице не найдены'
          : `Найдено форм: ${forms.length}, но ни одна не собирает персональные данные`,
      ),
    );
    // Без форм остальные проверки формы бессмысленны — именно 'na', а не 'pass'.
    for (const [id, title] of [
      ['FRM-02', 'Чекбокс согласия в форме'],
      ['FRM-03', 'Чекбокс согласия не предотмечен'],
      ['FRM-04', 'Ссылка на политику рядом с чекбоксом'],
      ['FRM-05', 'Формулировка согласия'],
      ['FRM-07', 'Форма отправляется на свой домен'],
    ] as const) {
      out.push(na(id, title, 'На странице нет форм сбора персональных данных'));
    }
    return out;
  }

  out.push(
    pass('FRM-01', 'Формы сбора персональных данных', `Найдено форм с полями ПДн: ${pdnForms.length}`, [
      { kind: 'note', value: pdnForms.map((f) => f.fieldNames.join(', ')).join(' | ').slice(0, 500) },
    ]),
  );

  // FRM-02 — есть ли вообще чекбокс согласия.
  const formsWithoutConsent = pdnForms.filter((f) => !f.checkboxes.some(isConsentCheckbox));
  if (formsWithoutConsent.length > 0) {
    out.push(
      fail(
        'FRM-02',
        'Чекбокс согласия в форме',
        'critical',
        `Форм с полями ПДн без чекбокса согласия: ${formsWithoutConsent.length} из ${pdnForms.length}. ` +
          'Данные собираются без фиксации согласия субъекта.',
        ['CONSENT_REQUIRED'],
        [{ kind: 'html', value: formsWithoutConsent[0].outerHtmlSample }],
      ),
    );
  } else {
    out.push(pass('FRM-02', 'Чекбокс согласия в форме', 'Во всех формах с ПДн есть чекбокс согласия'));
  }

  const consentBoxes = pdnForms.flatMap((f) => f.checkboxes.filter(isConsentCheckbox));

  // FRM-03 — предотмеченность. Читаем живое состояние, а не атрибут.
  if (consentBoxes.length === 0) {
    out.push(na('FRM-03', 'Чекбокс согласия не предотмечен', 'Чекбоксов согласия не найдено'));
    out.push(na('FRM-04', 'Ссылка на политику рядом с чекбоксом', 'Чекбоксов согласия не найдено'));
    out.push(na('FRM-05', 'Формулировка согласия', 'Чекбоксов согласия не найдено'));
  } else {
    const preChecked = consentBoxes.filter((c) => c.liveChecked);
    if (preChecked.length > 0) {
      out.push(
        fail(
          'FRM-03',
          'Чекбокс согласия не предотмечен',
          'high',
          `Предотмеченных чекбоксов согласия: ${preChecked.length}. ` +
            'Согласие по умолчанию не является выражением воли субъекта.' +
            (preChecked.some((c) => !c.hasCheckedAttr)
              ? ' Отметка выставлена скриптом, а не атрибутом checked — в разметке её не видно.'
              : ''),
          ['CONSENT_REQUIRED'],
          [{ kind: 'note', value: preChecked.map((c) => c.labelText).join(' || ').slice(0, 500) }],
        ),
      );
    } else {
      out.push(pass('FRM-03', 'Чекбокс согласия не предотмечен', 'Чекбоксы согласия сняты по умолчанию'));
    }

    // FRM-04 — активная ссылка на документ рядом с чекбоксом.
    const withoutLink = consentBoxes.filter((c) => !c.labelHasLink);
    if (withoutLink.length > 0) {
      out.push(
        fail(
          'FRM-04',
          'Ссылка на политику рядом с чекбоксом',
          'medium',
          `Чекбоксов согласия без ссылки на документ: ${withoutLink.length}. ` +
            'Субъект не может ознакомиться с условиями в момент дачи согласия.',
          [],
          [{ kind: 'note', value: withoutLink.map((c) => c.labelText).join(' || ').slice(0, 500) }],
        ),
      );
    } else {
      out.push(pass('FRM-04', 'Ссылка на политику рядом с чекбоксом', 'У всех чекбоксов согласия есть ссылка'));
    }

    // FRM-05 — содержательная формулировка, а не голый чекбокс.
    const tooShort = consentBoxes.filter((c) => c.labelText.length < 25);
    if (tooShort.length > 0) {
      out.push(
        fail(
          'FRM-05',
          'Формулировка согласия',
          'medium',
          'Рядом с чекбоксом нет внятной формулировки согласия — только отметка.',
          [],
          [{ kind: 'note', value: tooShort.map((c) => `"${c.labelText}"`).join(' || ') }],
        ),
      );
    } else {
      out.push(pass('FRM-05', 'Формулировка согласия', 'Формулировка согласия присутствует'));
    }
  }

  // FRM-07 — куда уходит форма. Отсутствие action ≠ нарушение.
  const withAction = pdnForms.filter((f) => f.action && !/^(#|javascript:)/i.test(f.action));
  const foreignAction = withAction.filter((f) => {
    try {
      const host = new URL(f.action!, page.url()).hostname;
      return host !== siteHost && !host.endsWith(`.${siteHost}`);
    } catch {
      return false;
    }
  });

  if (foreignAction.length > 0) {
    out.push(
      fail(
        'FRM-07',
        'Форма отправляется на свой домен',
        'high',
        `Форм, отправляющихся на посторонний домен: ${foreignAction.length}. ` +
          'Требует выяснения, где физически хранятся полученные данные.',
        ['LOCALIZATION'],
        [{ kind: 'url', value: foreignAction.map((f) => f.action!).join(' ') }],
      ),
    );
  } else if (withAction.length === 0) {
    out.push(
      unknown(
        'FRM-07',
        'Форма отправляется на свой домен',
        'У форм нет атрибута action — отправка идёт скриптом. ' +
          'По разметке адрес получателя не определяется; разрешается по сетевым запросам (INF-05).',
      ),
    );
  } else {
    out.push(pass('FRM-07', 'Форма отправляется на свой домен', 'Все формы с action ведут на свой домен'));
  }

  return out;
}
