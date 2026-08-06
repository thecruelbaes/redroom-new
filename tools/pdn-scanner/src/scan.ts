/**
 * Оркестратор скана одного сайта.
 *
 * Почему не `waitUntil: 'networkidle'`, как в спецификации: Playwright сам не
 * рекомендует этот режим, а на живых сайтах он просто не наступает — виджеты
 * чатов, поллинг, реклама и вебсокеты держат сеть занятой до таймаута.
 * Вместо него — domcontentloaded плюс явное «оседание»: прокрутка страницы
 * (без неё не стартуют ленивые счётчики) и ожидание паузы в запросах
 * с жёстким потолком по времени.
 */

import { chromium, type Browser, type BrowserContext } from 'playwright';
import { runDocumentChecks } from './checks/docs.js';
import { runFormChecks } from './checks/forms.js';
import { checkRequisites, runInfraChecks } from './checks/infra.js';
import { runTrackerChecks } from './checks/trackers.js';
import { checkRobots } from './robots.js';
import type { CheckResult, ScanResult, ScanTarget } from './types.js';

/**
 * Честный User-Agent с контактом — требование гигиены из спецификации.
 * Только ASCII: заголовки HTTP — ByteString, кириллица в них роняет fetch.
 */
export const DEFAULT_USER_AGENT =
  '152fz-audit-bot/1.0 (+mailto:audit@example.ru)';

export interface ScanOptions {
  readonly userAgent?: string;
  readonly timeoutMs?: number;
  readonly respectRobots?: boolean;
  /** Оставить true для прода. false — только для отладки на своих сайтах. */
  readonly headless?: boolean;
}

export async function createBrowser(headless = true): Promise<Browser> {
  // В контейнерах и CI браузер часто уже установлен отдельно от пакета playwright.
  // PDN_CHROMIUM_PATH позволяет использовать его, не подгоняя версию пакета под сборку.
  const executablePath = process.env.PDN_CHROMIUM_PATH || undefined;
  // Песочница Chromium не работает от root — типичный случай для докера.
  const args = process.env.PDN_NO_SANDBOX === '1' ? ['--no-sandbox'] : [];
  return chromium.launch({ headless, executablePath, args });
}

/** Ждём, пока страница перестанет грузить ресурсы, но не дольше потолка. */
async function settle(
  ctx: { pendingRequests: () => number },
  page: import('playwright').Page,
  capMs: number,
): Promise<void> {
  const deadline = Date.now() + capMs;

  // Прокрутка запускает ленивые счётчики и подгружаемые блоки.
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight && y < 20000) setTimeout(step, 150);
          else {
            window.scrollTo(0, 0);
            resolve();
          }
        };
        step();
      });
    });
  } catch {
    // Прокрутка не критична — идём дальше.
  }

  let quietSince = Date.now();
  while (Date.now() < deadline) {
    if (ctx.pendingRequests() > 0) quietSince = Date.now();
    else if (Date.now() - quietSince > 1200) return;
    await page.waitForTimeout(200);
  }
}

export async function scanSite(
  browser: Browser,
  target: ScanTarget,
  options: ScanOptions = {},
): Promise<ScanResult> {
  const startedAt = new Date().toISOString();
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const timeoutMs = options.timeoutMs ?? 45_000;
  const url = target.url.startsWith('http') ? target.url : `https://${target.domain}/`;
  const host = new URL(url).hostname;

  const finish = (
    ok: boolean,
    checks: CheckResult[],
    externalHosts: string[],
    error?: string,
    finalUrl?: string,
  ): ScanResult => ({
    target,
    startedAt,
    finishedAt: new Date().toISOString(),
    ok,
    error,
    finalUrl,
    checks,
    externalHosts,
  });

  if (options.respectRobots !== false) {
    const verdict = await checkRobots(new URL(url).origin, new URL(url).pathname, userAgent);
    if (!verdict.allowed) {
      return finish(false, [], [], `robots.txt: ${verdict.reason}`);
    }
  }

  let context: BrowserContext | null = null;
  try {
    context = await browser.newContext({
      userAgent,
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow',
      viewport: { width: 1366, height: 900 },
      ignoreHTTPSErrors: true,
    });
    // esbuild (через tsx) оборачивает функции в хелпер __name, включая тела,
    // которые уезжают в браузер через page.evaluate. В контексте страницы этого
    // хелпера нет, и любая такая проверка падала бы с ReferenceError.
    // Строковая форма addInitScript не проходит через трансформацию.
    await context.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((fn) => fn);' });

    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    const externalHosts = new Set<string>();
    const externalUrls: string[] = [];
    let pending = 0;

    // Слушатели вешаются ДО навигации — иначе первые запросы теряются,
    // а именно они обычно и есть счётчики.
    page.on('request', (req) => {
      pending += 1;
      try {
        const h = new URL(req.url()).hostname;
        if (h !== host && !h.endsWith(`.${host}`)) {
          externalHosts.add(h);
          if (externalUrls.length < 500) externalUrls.push(req.url());
        }
      } catch {
        /* data: и blob: игнорируем */
      }
    });
    const done = () => {
      pending = Math.max(0, pending - 1);
    };
    page.on('requestfinished', done);
    page.on('requestfailed', done);

    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    if (!response) return finish(false, [], [...externalHosts], 'нет ответа от сервера');
    if (response.status() >= 400) {
      return finish(false, [], [...externalHosts], `HTTP ${response.status()}`, page.url());
    }

    await settle({ pendingRequests: () => pending }, page, Math.min(timeoutMs, 15_000));

    const finalUrl = page.url();
    const pageText = await page
      .evaluate(() => document.body?.innerText ?? '')
      .catch(() => '');

    const checks: CheckResult[] = [
      ...(await runDocumentChecks(page)),
      ...(await runFormChecks(page, host)),
      ...(await runTrackerChecks(page, [...externalHosts], externalUrls)),
      ...(await runInfraChecks(host, finalUrl, externalUrls)),
      checkRequisites(pageText),
    ];

    return finish(true, checks, [...externalHosts], undefined, finalUrl);
  } catch (e) {
    return finish(false, [], [], String(e));
  } finally {
    await context?.close().catch(() => {});
  }
}
