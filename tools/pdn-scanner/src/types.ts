/**
 * Базовые типы сканера 152-ФЗ.
 *
 * Главное решение здесь — четыре состояния проверки вместо двух.
 * Спецификация требует «лучше недосказать, чем ошибиться», но выполнить это
 * невозможно, пока результат бинарный: любая неудачная детекция превращается
 * в обвинение. UNKNOWN существует, чтобы честно сказать «не смог проверить».
 * Он никогда не даёт severity, не попадает в скоринг и не попадает в письмо.
 */

export type CheckStatus =
  /** Требование выполнено. */
  | 'pass'
  /** Требование нарушено. Только это идёт в скоринг и в отчёт клиенту. */
  | 'fail'
  /** Проверить не удалось. Не улика. Не повод для письма. */
  | 'unknown'
  /** Проверка неприменима к этому сайту. */
  | 'na';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type EvidenceKind = 'url' | 'html' | 'selector' | 'hosts' | 'note';

export interface Evidence {
  readonly kind: EvidenceKind;
  readonly value: string;
}

export interface CheckResult {
  /** DOC-01, FRM-02, CK-04, ... */
  readonly id: string;
  readonly title: string;
  readonly status: CheckStatus;
  /** Заполняется только при status === 'fail'. */
  readonly severity?: Severity;
  /** Почему статус именно такой. Для 'unknown' и 'fail' — обязательно. */
  readonly reason: string;
  readonly evidence: readonly Evidence[];
  /** Идентификаторы норм из legal.ts. Пусто — значит закон в отчёте не цитируем. */
  readonly legal: readonly string[];
}

/** Ниши влияют на приоритет лида, а не на тяжесть нарушения. */
export type Niche =
  | 'medicine'
  | 'education'
  | 'legal_finance'
  | 'services'
  | 'retail'
  | 'unknown';

export interface ScanTarget {
  readonly domain: string;
  readonly url: string;
  readonly orgName?: string;
  readonly niche?: Niche;
  /** ИНН нужен для ORG-01 — сверки с реестром операторов РКН. */
  readonly inn?: string;
}

export interface ScanResult {
  readonly target: ScanTarget;
  readonly startedAt: string;
  readonly finishedAt: string;
  /** Сканирование могло не состояться: robots.txt, таймаут, отказ сервера. */
  readonly ok: boolean;
  readonly error?: string;
  readonly finalUrl?: string;
  readonly checks: readonly CheckResult[];
  /** Все внешние хосты, к которым обращалась страница. Сырьё для CK-*. */
  readonly externalHosts: readonly string[];
}

export const isFail = (c: CheckResult): boolean => c.status === 'fail';

/**
 * Единственный способ создать результат «нарушено».
 * Требует severity и причину — чтобы нельзя было случайно обвинить молча.
 */
export function fail(
  id: string,
  title: string,
  severity: Severity,
  reason: string,
  legal: readonly string[] = [],
  evidence: readonly Evidence[] = [],
): CheckResult {
  return { id, title, status: 'fail', severity, reason, legal, evidence };
}

export function pass(
  id: string,
  title: string,
  reason: string,
  evidence: readonly Evidence[] = [],
): CheckResult {
  return { id, title, status: 'pass', reason, legal: [], evidence };
}

/**
 * Проверка не удалась. Обязательна причина — «unknown» без объяснения
 * через месяц неотличим от бага.
 */
export function unknown(
  id: string,
  title: string,
  reason: string,
  evidence: readonly Evidence[] = [],
): CheckResult {
  return { id, title, status: 'unknown', reason, legal: [], evidence };
}

export function na(id: string, title: string, reason: string): CheckResult {
  return { id, title, status: 'na', reason, legal: [], evidence: [] };
}
