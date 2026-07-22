import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Простой in-memory rate-limit по IP (на один инстанс).
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  // периодическая чистка протухших записей, чтобы Map не рос бесконечно
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.ts > WINDOW_MS) hits.delete(k);
  }
  const rec = hits.get(ip);
  if (!rec || now - rec.ts > WINDOW_MS) {
    hits.set(ip, { count: 1, ts: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

function clean(v: unknown, max = 600): string {
  return String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  // x-real-ip выставляется nginx'ом напрямую из $remote_addr и клиент подделать не может —
  // приоритет ему. x-forwarded-for оставлен только как fallback (например, на Vercel).
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 30);
  const service = clean(body.service, 80);
  const comment = clean(body.comment, 500);

  if (!name || phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Укажите имя и корректный телефон' }, { status: 422 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Если бот не настроен — логируем и возвращаем успех, чтобы не терять лид на этапе разработки.
  if (!token || !chatId) {
    console.warn('[lead] TELEGRAM не настроен. Заявка:', { name, phone, service, comment });
    return NextResponse.json({ ok: true, warning: 'telegram_not_configured' });
  }

  // Экранируем пользовательский ввод для HTML parse_mode (безопасно от инъекций и от поломки разметки).
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const text =
    `🥁 <b>Новая заявка — RedRoom Studio</b>\n\n` +
    `👤 Имя: ${esc(name)}\n` +
    `📞 Телефон: ${esc(phone)}\n` +
    `🎸 Направление: ${esc(service) || '—'}\n` +
    `💬 Комментарий: ${esc(comment) || '—'}\n\n` +
    `🕒 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      const detail = await tgRes.text();
      console.error('[lead] Telegram error:', detail);
      return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[lead] fetch error:', err);
    return NextResponse.json({ error: 'Сервис временно недоступен' }, { status: 503 });
  }
}
