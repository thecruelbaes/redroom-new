/**
 * Минимальная проверка robots.txt.
 *
 * Спецификация требует уважать robots.txt, и это не только вежливость:
 * инструмент, который продаёт соблюдение правил, не может сам их игнорировать.
 * Первый же клиент, заметивший бота в логах вопреки запрету, получает
 * бесплатный аргумент против нас.
 *
 * Разбор намеренно консервативный: при любой неоднозначности считаем, что
 * сканировать нельзя.
 */

export interface RobotsVerdict {
  readonly allowed: boolean;
  readonly reason: string;
}

interface Group {
  agents: string[];
  disallow: string[];
  allow: string[];
  crawlDelay?: number;
}

function parse(text: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    if (!current) continue;
    lastWasAgent = false;
    if (field === 'disallow') current.disallow.push(value);
    else if (field === 'allow') current.allow.push(value);
    else if (field === 'crawl-delay') {
      const n = Number(value);
      if (Number.isFinite(n)) current.crawlDelay = n;
    }
  }
  return groups;
}

const matches = (rule: string, path: string): boolean => {
  if (rule === '') return false;
  // Поддерживаем только * — этого достаточно для подавляющего большинства файлов.
  const re = new RegExp(
    '^' + rule.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*'),
  );
  return re.test(path);
};

export async function checkRobots(
  origin: string,
  path: string,
  userAgent: string,
): Promise<RobotsVerdict & { crawlDelay?: number }> {
  let text: string;
  try {
    const res = await fetch(new URL('/robots.txt', origin), {
      signal: AbortSignal.timeout(15_000),
      headers: { 'user-agent': userAgent },
    });
    // Нет файла — обход разрешён. Это стандартное поведение.
    if (res.status === 404 || res.status === 410) {
      return { allowed: true, reason: 'robots.txt отсутствует — ограничений нет' };
    }
    if (!res.ok) {
      // 5xx трактуем строго: сервер не смог сказать «можно».
      return res.status >= 500
        ? { allowed: false, reason: `robots.txt недоступен (HTTP ${res.status}) — считаем запретом` }
        : { allowed: true, reason: `robots.txt отдал HTTP ${res.status} — ограничений не установлено` };
    }
    text = await res.text();
  } catch (e) {
    return { allowed: false, reason: `robots.txt не получен (${String(e)}) — считаем запретом` };
  }

  const groups = parse(text);
  const ua = userAgent.toLowerCase();
  const specific = groups.find((g) => g.agents.some((a) => a !== '*' && ua.includes(a)));
  const wildcard = groups.find((g) => g.agents.includes('*'));
  const group = specific ?? wildcard;

  if (!group) return { allowed: true, reason: 'подходящих правил в robots.txt нет' };

  const longestMatch = (rules: string[]) =>
    rules.filter((r) => matches(r, path)).sort((a, b) => b.length - a.length)[0];

  const disallowed = longestMatch(group.disallow);
  const allowed = longestMatch(group.allow);

  if (disallowed && (!allowed || allowed.length < disallowed.length)) {
    return {
      allowed: false,
      reason: `запрещено правилом Disallow: ${disallowed}`,
      crawlDelay: group.crawlDelay,
    };
  }
  return { allowed: true, reason: 'обход разрешён', crawlDelay: group.crawlDelay };
}
