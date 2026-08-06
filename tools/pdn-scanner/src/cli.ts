/**
 * CLI сканера.
 *
 *   npx tsx src/cli.ts redroom-studio.ru
 *   npx tsx src/cli.ts --input domains.csv --out raw_results.json --niche education
 *
 * Ограничения обхода из спецификации соблюдаются по умолчанию:
 * не чаще одного запроса в 2 секунды на домен, параллелизм 3, честный
 * User-Agent, robots.txt уважается.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { allNorms, formatFine, pendingVerification } from './legal.js';
import { scoreLead } from './score.js';
import { createBrowser, scanSite } from './scan.js';
import type { Niche, ScanResult, ScanTarget } from './types.js';

interface Args {
  readonly targets: string[];
  readonly input?: string;
  readonly out: string;
  readonly niche: Niche;
  readonly concurrency: number;
  readonly delayMs: number;
  readonly showLaw: boolean;
}

function parseArgs(argv: string[]): Args {
  const targets: string[] = [];
  let input: string | undefined;
  let out = 'raw_results.json';
  let niche: Niche = 'unknown';
  let concurrency = 3;
  let delayMs = 2000;
  let showLaw = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input') input = argv[++i];
    else if (a === '--out') out = argv[++i];
    else if (a === '--niche') niche = argv[++i] as Niche;
    else if (a === '--concurrency') concurrency = Number(argv[++i]);
    else if (a === '--delay') delayMs = Number(argv[++i]);
    else if (a === '--law') showLaw = true;
    else if (!a.startsWith('--')) targets.push(a);
  }
  return { targets, input, out, niche, concurrency, delayMs, showLaw };
}

/** Читает domains.csv: первая колонка — домен, опционально niche и inn. */
async function readTargets(path: string, fallbackNiche: Niche): Promise<ScanTarget[]> {
  const text = await readFile(path, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('domain');
  const cols = hasHeader ? header.split(',').map((c) => c.trim()) : [];
  const idx = (name: string) => cols.indexOf(name);

  return lines.slice(hasHeader ? 1 : 0).map((line) => {
    const parts = line.split(',').map((p) => p.trim());
    const domain = (hasHeader ? parts[Math.max(0, idx('domain'))] : parts[0]).replace(
      /^https?:\/\//,
      '',
    );
    const nicheCol = hasHeader ? idx('niche') : -1;
    const innCol = hasHeader ? idx('inn') : -1;
    const nameCol = hasHeader ? idx('org_name') : -1;
    return {
      domain,
      url: `https://${domain}/`,
      orgName: nameCol >= 0 ? parts[nameCol] : undefined,
      inn: innCol >= 0 ? parts[innCol] : undefined,
      niche: (nicheCol >= 0 && parts[nicheCol] ? parts[nicheCol] : fallbackNiche) as Niche,
    };
  });
}

const SYMBOL = { pass: '✓', fail: '✗', unknown: '?', na: '—' } as const;

function printResult(result: ScanResult, niche: Niche): void {
  const score = scoreLead(result, result.target.niche ?? niche);
  console.log(`\n${'='.repeat(72)}`);
  console.log(`${result.target.url}${result.ok ? '' : `  — СКАН НЕ СОСТОЯЛСЯ: ${result.error}`}`);
  if (!result.ok) return;

  for (const c of result.checks) {
    const sev = c.status === 'fail' ? ` [${c.severity}]` : '';
    console.log(`  ${SYMBOL[c.status]} ${c.id.padEnd(7)} ${c.title}${sev}`);
    if (c.status === 'fail' || c.status === 'unknown') {
      console.log(`      ${c.reason.replace(/\n/g, '\n      ')}`);
    }
  }

  console.log(
    `\n  Балл: ${score.score} (сырой ${score.raw} × ${score.factor} за нишу «${score.niche}»)` +
      `\n  Критичных: ${score.counts.critical}, важных: ${score.counts.high}, ` +
      `замечаний: ${score.counts.medium + score.counts.low}` +
      `\n  Уверенность скана: ${Math.round(score.confidence * 100)}%` +
      `\n  Вердикт: ${score.verdict.toUpperCase()} — ${score.verdictReason}`,
  );
}

function printLegalRegistry(): void {
  console.log('\nРеестр норм — состояние проверки\n' + '='.repeat(72));
  for (const n of allNorms()) {
    const mark =
      { verified: '✓', probable: '~', disputed: '!', debunked: '✗' }[n.confidence] ?? '?';
    console.log(`\n${mark} ${n.id}  [${n.confidence}]`);
    console.log(`   Обязанность: ${n.duty}`);
    console.log(`   Норма: ${n.source}`);
    console.log(`   Ответственность: ${n.liability}`);
    if (n.fines) {
      console.log(
        `   Штрафы: должн. ${formatFine(n.fines.official)}, ` +
          `ИП ${formatFine(n.fines.entrepreneur)}, юрлицо ${formatFine(n.fines.company)}`,
      );
    }
    console.log(`   ${n.note.replace(/\n/g, '\n   ')}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.showLaw) {
    printLegalRegistry();
    return;
  }

  const targets: ScanTarget[] = args.input
    ? await readTargets(args.input, args.niche)
    : args.targets.map((t) => {
        // Полный URL принимаем как есть — нужно для локальных фикстур и для
        // сайтов, живущих не в корне домена.
        const url = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/\/.*$/, '')}/`;
        return { domain: new URL(url).hostname, url, niche: args.niche };
      });

  if (targets.length === 0) {
    console.error(
      'Не указано ни одного домена.\n' +
        '  npx tsx src/cli.ts example.ru\n' +
        '  npx tsx src/cli.ts --input domains.csv --niche medicine\n' +
        '  npx tsx src/cli.ts --law    — показать реестр норм и статус их проверки',
    );
    process.exitCode = 1;
    return;
  }

  const browser = await createBrowser();
  const results: ScanResult[] = [];
  const queue = [...targets];

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const target = queue.shift();
      if (!target) return;
      const result = await scanSite(browser, target);
      results.push(result);
      printResult(result, args.niche);
      // Ограничение частоты: спецификация требует не чаще 1 запроса в 2–3 с.
      await new Promise((r) => setTimeout(r, args.delayMs));
    }
  };

  await Promise.all(Array.from({ length: Math.min(args.concurrency, targets.length) }, worker));
  await browser.close();

  await writeFile(
    args.out,
    JSON.stringify(
      results.map((r) => ({ ...r, score: scoreLead(r, r.target.niche ?? args.niche) })),
      null,
      2,
    ),
    'utf8',
  );
  console.log(`\nРезультаты записаны в ${args.out}`);

  const pending = pendingVerification();
  if (pending.length > 0) {
    console.log(
      `\nВНИМАНИЕ: ${pending.length} норм(ы) ещё не сверены с первоисточником:\n` +
        pending.map((n) => `  • ${n.id} (${n.confidence}) — ${n.liability}`).join('\n') +
        '\nДо сверки нельзя печатать суммы штрафов в клиентском отчёте. ' +
        'Запустите с флагом --law, чтобы увидеть подробности.',
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
