/**
 * Инфраструктура (INF-*).
 *
 * INF-04 (хостинг в РФ) намеренно возвращает UNKNOWN.
 *
 * Причина не в лени, а в существе нормы: требование локализации касается места
 * хранения базы данных, а не места, откуда отдаётся HTML. Сайт может рендериться
 * с зарубежного CDN, а заявки складываться в российскую CRM — и наоборот.
 * Вывод «зарубежный IP → нарушена локализация» неверен юридически и создаёт
 * ровно то ложное обвинение, которое дороже пропущенного нарушения.
 *
 * Поэтому IP фиксируется как факт, а вывод не делается: это вопрос клиенту.
 * INF-05 (куда фактически уходят данные форм) содержательнее и надёжнее.
 */

import { promises as dns } from 'node:dns';
import tls from 'node:tls';
import { type CheckResult, fail, pass, unknown } from '../types.js';
import { FOREIGN_FORM_ENDPOINTS } from './trackers.js';

interface CertInfo {
  readonly validTo: Date;
  readonly issuer: string;
}

function inspectCertificate(host: string, timeoutMs = 15_000): Promise<CertInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, rejectUnauthorized: false, timeout: timeoutMs },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) return reject(new Error('сертификат не получен'));
        // Поля issuer у node могут быть массивом при нескольких значениях RDN.
        const issuerRaw = cert.issuer?.O ?? cert.issuer?.CN ?? 'неизвестен';
        resolve({
          validTo: new Date(cert.valid_to),
          issuer: Array.isArray(issuerRaw) ? issuerRaw.join(', ') : issuerRaw,
        });
      },
    );
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      reject(new Error('таймаут TLS-соединения'));
    });
    socket.on('error', reject);
  });
}

export async function runInfraChecks(
  host: string,
  finalUrl: string,
  externalUrls: readonly string[],
): Promise<CheckResult[]> {
  const out: CheckResult[] = [];

  // INF-01 / INF-02 — HTTPS и редирект с HTTP.
  out.push(
    finalUrl.startsWith('https://')
      ? pass('INF-01', 'Сайт работает по HTTPS', 'Итоговый адрес использует HTTPS')
      : fail(
          'INF-01',
          'Сайт работает по HTTPS',
          'high',
          'Сайт отдаётся по HTTP. Персональные данные из форм передаются в открытом виде.',
          [],
          [{ kind: 'url', value: finalUrl }],
        ),
  );

  try {
    const res = await fetch(`http://${host}/`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
    const location = res.headers.get('location') ?? '';
    out.push(
      res.status >= 300 && res.status < 400 && location.startsWith('https://')
        ? pass('INF-02', 'HTTP перенаправляет на HTTPS', `HTTP ${res.status} → ${location}`)
        : fail(
            'INF-02',
            'HTTP перенаправляет на HTTPS',
            'medium',
            `Обращение по http:// не перенаправляется на https:// (HTTP ${res.status}).`,
            [],
            [{ kind: 'url', value: `http://${host}/` }],
          ),
    );
  } catch (e) {
    out.push(unknown('INF-02', 'HTTP перенаправляет на HTTPS', `Проверка не удалась: ${String(e)}`));
  }

  // INF-03 — срок действия сертификата.
  try {
    const cert = await inspectCertificate(host);
    const daysLeft = Math.floor((cert.validTo.getTime() - Date.now()) / 86_400_000);
    out.push(
      daysLeft < 0
        ? fail(
            'INF-03',
            'Сертификат действителен',
            'high',
            `Сертификат истёк ${cert.validTo.toLocaleDateString('ru-RU')}.`,
          )
        : daysLeft < 30
          ? fail(
              'INF-03',
              'Сертификат действителен',
              'medium',
              `Сертификат истекает через ${daysLeft} дн. (${cert.validTo.toLocaleDateString('ru-RU')}).`,
            )
          : pass(
              'INF-03',
              'Сертификат действителен',
              `Действует ещё ${daysLeft} дн., издатель: ${cert.issuer}`,
            ),
    );
  } catch (e) {
    out.push(unknown('INF-03', 'Сертификат действителен', `Не удалось проверить сертификат: ${String(e)}`));
  }

  // INF-04 — сознательно без вывода. Фиксируем факт, вывод оставляем человеку.
  try {
    // Хост может быть уже адресом (локальные фикстуры) — резолвить нечего.
    const addresses = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? [host] : await dns.resolve4(host);
    out.push(
      unknown(
        'INF-04',
        'Размещение сайта',
        `Сайт резолвится в ${addresses.join(', ')}. Геопринадлежность не определяется: ` +
          'локальной базы ASN нет, а главное — место отдачи HTML не равно месту хранения базы данных. ' +
          'Требование локализации касается второго. Это вопрос клиенту, а не находка.',
        [{ kind: 'note', value: addresses.join(', ') }],
      ),
    );
  } catch (e) {
    out.push(unknown('INF-04', 'Размещение сайта', `DNS-запрос не удался: ${String(e)}`));
  }

  // INF-05 — куда фактически уходят данные. Это и есть содержательная проверка.
  const foreignEndpoints = FOREIGN_FORM_ENDPOINTS.filter(([pattern]) =>
    externalUrls.some((u) => u.includes(pattern)),
  );
  out.push(
    foreignEndpoints.length === 0
      ? pass('INF-05', 'Приём данных форм', 'Обращений к известным зарубежным приёмникам форм не замечено')
      : fail(
          'INF-05',
          'Приём данных форм',
          'high',
          `Страница обращается к зарубежным сервисам приёма данных: ` +
            `${foreignEndpoints.map(([, name]) => name).join(', ')}. ` +
            'Если через них проходят заявки, данные записываются в базу за пределами РФ — ' +
            'это прямо касается требования о локализации.',
          ['LOCALIZATION'],
          [{ kind: 'hosts', value: foreignEndpoints.map(([p]) => p).join(', ') }],
        ),
  );

  return out;
}

/** INF-06 — реквизиты организации на сайте. Отдельно, т.к. нужен DOM. */
export function checkRequisites(pageText: string): CheckResult {
  // Без \b — это ASCII-граница слова, с кириллицей она не работает.
  const m = pageText.match(/(?:^|[^А-Яа-яЁёA-Za-z])(ИНН|ОГРНИП|ОГРН)[\s:—–-]*(\d[\d\s]{8,17})/iu);
  return m
    ? pass('INF-06', 'Реквизиты организации на сайте', `Найдено: ${m[1]} ${m[2].trim()}`)
    : fail(
        'INF-06',
        'Реквизиты организации на сайте',
        'low',
        'На главной странице не найдены ИНН или ОГРН. ' +
          'Без реквизитов невозможно ни установить оператора, ни проверить его в реестре РКН.',
        [],
      );
}
