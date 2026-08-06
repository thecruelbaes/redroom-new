/**
 * Скоринг лида.
 *
 * Ключевое отличие от спецификации: в сумму идут ТОЛЬКО статусы 'fail'.
 * Состояния 'unknown' и 'na' не весят ничего. Это единственный способ
 * выполнить требование «лучше недосказать, чем ошибиться» на уровне модели,
 * а не на уровне благих намерений: не сумев проверить, сканер не может
 * случайно превратить свою неудачу в обвинение и в приоритет лида.
 *
 * Второе отличие: считается не только сумма, но и «уверенность» — доля
 * проверок, которые удалось выполнить. Лид с высоким баллом и уверенностью
 * 40% означает не «горячий», а «сканировать заново», и уходит в отдельную
 * корзину, а не в рассылку.
 */

import type { CheckResult, Niche, ScanResult, Severity } from './types.js';

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

const NICHE_FACTOR: Record<Niche, number> = {
  medicine: 2.0,
  education: 1.8,
  legal_finance: 1.6,
  services: 1.2,
  retail: 1.0,
  unknown: 1.0,
};

export interface LeadScore {
  readonly raw: number;
  readonly score: number;
  readonly niche: Niche;
  readonly factor: number;
  readonly counts: Record<Severity, number>;
  /** Доля проверок, давших определённый ответ (pass или fail). */
  readonly confidence: number;
  readonly unknownIds: readonly string[];
  /** Стоит ли вообще касаться этого лида. */
  readonly verdict: 'contact' | 'rescan' | 'skip';
  readonly verdictReason: string;
}

/** Порог из спецификации: ниже — шум. */
const SCORE_THRESHOLD = 6;
/** Ниже этой уверенности результат нельзя показывать клиенту. */
const CONFIDENCE_THRESHOLD = 0.7;

export function scoreLead(result: ScanResult, niche: Niche = 'unknown'): LeadScore {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  let raw = 0;

  for (const c of result.checks) {
    if (c.status !== 'fail' || !c.severity) continue;
    counts[c.severity] += 1;
    raw += SEVERITY_WEIGHT[c.severity];
  }

  const decidable = result.checks.filter((c) => c.status !== 'na');
  const decided = decidable.filter((c) => c.status === 'pass' || c.status === 'fail');
  const confidence = decidable.length === 0 ? 0 : decided.length / decidable.length;
  const unknownIds = decidable.filter((c) => c.status === 'unknown').map((c) => c.id);

  const factor = NICHE_FACTOR[niche];
  const score = Math.round(raw * factor * 10) / 10;

  let verdict: LeadScore['verdict'];
  let verdictReason: string;

  if (!result.ok) {
    verdict = 'skip';
    verdictReason = `Скан не состоялся: ${result.error ?? 'неизвестная причина'}`;
  } else if (confidence < CONFIDENCE_THRESHOLD) {
    verdict = 'rescan';
    verdictReason =
      `Определён только ${Math.round(confidence * 100)}% проверок. ` +
      `Отчёт по такому скану показывать нельзя. Не удалось: ${unknownIds.join(', ')}`;
  } else if (score < SCORE_THRESHOLD) {
    verdict = 'skip';
    verdictReason = `Балл ${score} ниже порога ${SCORE_THRESHOLD} — содержательного повода для письма нет`;
  } else {
    verdict = 'contact';
    verdictReason = `Балл ${score} при уверенности ${Math.round(confidence * 100)}%`;
  }

  return { raw, score, niche, factor, counts, confidence, unknownIds, verdict, verdictReason };
}

/**
 * Находки, которые допустимо назвать в первом письме.
 * Всё, что мы не смогли проверить, сюда не попадает по построению.
 */
export function reportableFindings(result: ScanResult): readonly CheckResult[] {
  return result.checks
    .filter((c) => c.status === 'fail' && c.severity !== 'low')
    .sort((a, b) => SEVERITY_WEIGHT[b.severity!] - SEVERITY_WEIGHT[a.severity!]);
}
