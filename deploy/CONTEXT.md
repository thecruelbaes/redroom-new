# RedRoomNew — рабочий контекст (handoff)

> Единый файл памяти по проекту. Обновлять при значимых изменениях.
> Последнее обновление: 2026-07-24

---

## 1. Что это

**RedRoom Studio** — маркетинговый сайт студии уроков барабанов/гитары в Новороссийске.
Позиционирование: **студия** (не школа). Живой домен: **https://nvrskmusic.ru** (и `www`).

- Стек: **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4**.
- Репозиторий кода: `https://github.com/thecruelbaes/redroom-new` (ветка `main`).
- Локальный путь: `websites/RedRoomNew` внутри репо Jarvis.
- Хостинг: **только Beget VPS** (`31.129.106.107`). **Vercel больше не трогаем** — деплой сразу на VPS.
- Раньше сайт был на Тильде — мигрировали, сохранив Яндекс.Директ/Метрику.

---

## 2. Доступы и ключевые параметры

### VPS (Beget)
```
ssh root@31.129.106.107
пароль: zdAyGQ8Q&ifC
hostkey: SHA256:l70VZqE9D6gp+VtA5I56r9NzjUJ+xltFrwlywidHzx8
```
Деплой одной командой (с Windows, через plink):
```
plink -ssh -batch -hostkey "SHA256:l70VZqE9D6gp+VtA5I56r9NzjUJ+xltFrwlywidHzx8" -pw "zdAyGQ8Q&ifC" root@31.129.106.107 "cd ~/apps/redroom-new && git pull && docker compose up -d --build"
```
Если менялись `NEXT_PUBLIC_*` env или образ закешировался — `docker compose build --no-cache && docker compose up -d`.

### Архитектура на сервере (multi-service ready)
- Папка приложений: `~/apps/` (конвенция; сейчас там `redroom-new`).
- Внешняя docker-сеть `redroom-net` — для будущей изоляции CRM/бота.
- Резерв портов (bind только на `127.0.0.1`, наружу — только nginx):
  - `3000` — сайт RedRoom
  - `3001` — будущая CRM
  - `3002` — будущий бот
- nginx — единственный публичный сервис, reverse proxy + Let's Encrypt (certbot).
- SSL выпущен на apex + `www` (`certbot --expand`).
- UFW: разрешены SSH + 80 + 443, остальное deny.

### Яндекс
- **Метрика счётчик:** `109568162` (перенесён со старой Тильды).
- Сниппет требует `ssr: true` + явные `referrer`/`url` для SSR (не generic-код), `webvisor: true`, `ecommerce: "dataLayer"`.
- Автоцели (zero-code): Форма, Мессенджер переход, Просмотр страницы (2 стр.), «по номеру» (клик tel:), Переход в соцсеть, заполнил/отправил контакты.
- Ручная цель `lead_submit` — стреляет `window.ym(109568162, 'reachGoal', 'lead_submit')` в `ContactForm.tsx` только при реальном успехе.
- Верификация Яндекса: env `NEXT_PUBLIC_YANDEX_VERIFICATION` (был код `07c2355cbef52250`).

### Supabase (для /admin панели отзывов)
```
NEXT_PUBLIC_SUPABASE_URL=https://ynfagodsmwtqxwuemocs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key — см. .env на VPS>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE ROLE — НЕ КОММИТИТЬ, только в .env на VPS>
```
(project ref `ynfagodsmwtqxwuemocs`. Реальные значения — только в `.env` на сервере, в репозиторий не попадают.)

### Admin панель
```
ADMIN_PASSWORD=<пароль админки — только в .env на VPS, не коммитить>
ADMIN_SESSION_SECRET=<случайный, задан на VPS>
```
`lib/auth.ts` — ленивый `assertConfigured()`: в проде бросает, если пароль/секрет пустые (fail-closed).

### Telegram (лид-форма)
- Токен бота и chat_id заданы в `.env` на VPS (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
- Паттерн доставки в «беседу» (группу) как у проекта Bronx.
- Эндпоинт `/api/lead` постит заявку в Telegram; если не сконфигурен — возвращает `warning`, и фронт НЕ показывает ложный успех.

---

## 3. Структура контента — единый источник правды

**`lib/content.ts`** содержит: `SITE`, `SERVICES`, `WHAT_ELSE`, `ADVANTAGES`, `HOW_IT_WORKS`, `STATS`, `TEACHERS`, `GALLERY`, `REVIEWS`, `RATING_SUMMARY`, `FAQ`.

### SITE (ключевое)
`url: 'https://nvrskmusic.ru'`, `yandexMetrikaId: '109568162'`, плюс `vk`, `yandexMaps`, `gis2`, `inn`, `ogrnip`, `legalAddress`, ужатый `description`.

### SERVICES (2 карточки)
- Барабаны — `position: 'top'`.
- Гитара — картинка `public/images/service-guitar.jpg`, кастомный кроп через `objectPosition` (inline style, не Tailwind-классы — JIT не подхватывает динамику).
  - Итоговый «guitar-forward» кроп из исходника `images/IMG_4496.jpg` (2090×3000):
    `sharp('images/IMG_4496.jpg').extract({ left:0, top:400, width:2090, height:1040 }).resize({ width:1200 })` → ~147134 байт.
  - Градиент в `Services.tsx` смягчён (`from-surface/70 via-surface/5`), `opacity-80`, высота контейнера `h-72`.

### ADVANTAGES — 5 карточек в один ряд (grid `sm:grid-cols-2 lg:grid-cols-5` в `Why.tsx`)
Порядок:
1. Только индивидуально
2. Опытные преподаватели
3. Живые инструменты и звук (слиты оборудование + качество звука)
4. Любой возраст и уровень — текст: *«Берём детей с 10 лет и взрослых — хоть с нуля, хоть с опытом. Почти каждый приходит с мыслью «у меня не получится» — и почти у каждого она проходит на первом же занятии.»*
5. Уроки и запись в одном месте (перемещена в конец)

### HOW_IT_WORKS — «Этапы нашего обучения» (последнее изменение, 2026-07-24)
Текст оставлен **буквальным по оригиналу владельца на «вы»**, поправлены только опечатки/пунктуация:
- 01 Знакомство — «Знакомство со студией, с преподавателем, с процессом обучения — выявляем музыкальные предпочтения и пожелания ученика.»
- 02 План занятий — «К каждому ученику мы подходим индивидуально: не только подстраиваем отдельные этапы обучения под музыкальные предпочтения и интересы ученика, но и обсуждаем график занятий.»
- 03 Контроль и развитие — «…Лучшим отзывом об обучении будут бурные овации зрителей на вашем выступлении.» (исправлено «зрителе»→«зрителей»)
- 04 Выступление на сцене — «У нас в студии вы не только получаете знания и навыки, но и возможность продемонстрировать полученные умения на сцене.»

### STATS
`200+ учеников` · `Работаем с 2014 года` · `12 занятий до результата` · `∞ удовольствия`

---

## 4. SEO / schema
- `app/layout.tsx`: JSON-LD `@type: MusicSchool`, `openingHoursSpecification` (7 дней 09:00–20:00, по записи), `sameAs: [telegramChannel, vk, yandexMaps, gis2]`.
- **НЕ добавлять `aggregateRating`** в schema ради звёзд — Google не покажет self-serving рейтинг для LocalBusiness/MusicSchool (политика с 2019), Яндекс берёт рейтинг из своей карточки. Правильный рычаг — `sameAs` на верифицированные профили.
- `public/llms.txt` — гайд для AI-краулеров (реальные факты: 200+ учеников, с 2014, 5.0/80 отзывов на Я.Картах).

---

## 5. Безопасность (аудит был проведён, фиксы внесены)
- Rate-limit ключи: предпочитают `x-real-ip` вместо первого элемента `x-forwarded-for` (`app/admin/actions.ts`, `app/api/lead/route.ts`).
- nginx: `X-Forwarded-For` = `$remote_addr` (замена), а не `$proxy_add_x_forwarded_for` (append, спуфится).
- Admin fail-closed (`lib/auth.ts`).
- Лид-пайплайн: `warning` не показывается как успех.
- Триггер повторного аудита: фраза «делаем аудит нашего приложения» = запускать cloudflare `security-audit-skill`.

---

## 6. Грабли (важно помнить)
- **`.dockerignore` не должен исключать `.env`** — Next.js читает `NEXT_PUBLIC_*` на этапе `npm run build`. Исключение `.env` молча ломает Supabase-клиент и т.п. (Финальный образ `.env` всё равно не копирует — утечки нет.)
- **Vercel «Sensitive» env** — `vercel env pull` молча пишет пустую `""` для Sensitive-переменных без ошибки. Проверять функционально, не «сайт открывается». (Из-за этого ломались Telegram/Supabase/Admin на VPS.)
- **Docker build cache** — после смены файла/пути делать `docker compose build --no-cache`, иначе отдаёт старый слой.
- **Путь картинки** — `content.ts` ссылается на `public/images/service-guitar.jpg` (НЕ `public/service-guitar.jpg`).
- **Windows sandbox networking** — `curl`/`Invoke-WebRequest` с заголовком `Host` молча ресолвят через реальный DNS. Внешнюю доступность тестировать только по SSH с самого VPS (`curl 127.0.0.1:PORT`).
- **Bash-tool quoting bug** — многострочные `node -e "..."` плодят мусорные файлы (`console.log('...`, `setTimeout(r` и т.п.) → `rm -f` после каждой такой команды.
- **Puppeteer clip** — `captureBeyondViewport` использует АБСОЛЮТНЫЕ координаты страницы для `clip`, не относительные к вьюпорту. Тестовый паттерн: `npm i --no-save puppeteer-core`, `executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'`, потом `npm uninstall puppeteer-core` + удалить временные скрипты.
- В корне проекта лежит реальный файл `ДОГОВОР ОКАЗАНИЯ УСЛУГ 2026.docx` (38KB) — НЕ мусор, не удалять.

---

## 7. Стандартный воркфлоу изменения контента
1. Правка в `lib/content.ts` (или компоненте).
2. `cd websites/RedRoomNew && npx tsc --noEmit -p tsconfig.json` — типизация.
3. `git add … && git commit -m "…"` (чистить stray-файлы перед add).
4. `git push origin main`.
5. Деплой на VPS (команда plink выше).
6. Проверка живьём: `curl -s https://nvrskmusic.ru/ | grep -o "<фраза>"`.

---

## 8. Открытые задачи
- Яндекс.Директ: проверить sitelinks/быстрые ссылки объявлений на битые URL — это владелец делает у себя в кабинете; предлагал починить найденное.
- Фото гитарной карточки — «guitar-forward» кроп принят по косвенным признакам, явного «идеально» не было; следить за фидбеком.
- Будущее: CRM (порт 3001) и, возможно, бот (порт 3002) на том же VPS в сети `redroom-net`.

---

## 9. Смежные проекты экосистемы (для справки)
- **RedRoom (старый лендинг)** — `websites/redroom/index.html`, живой на Тильде был раньше.
- **RedRoomBot** — `websites/RedRoomBot/redroom-bot` (Node+TS+grammY+SQLite), YCLIENTS-уведомления.
- **Bronx Service** — детейлинг, `websites/bronx-service/` (Next.js 15), паттерн Telegram-лида `/api/lead` (референс для беседы).
