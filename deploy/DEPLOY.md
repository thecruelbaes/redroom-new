# Деплой на VPS — пошагово

Цель: поднять сайт на новом VPS и посадить на домен **nvrskmusic.ru**.
Подробный бизнес-контекст (Метрика, Директ, редирект и т.д.) — в `../RedRoom_Studio_план.md`, раздел 7.
Здесь — только техническая часть: сервер → Docker → nginx → SSL.

## Что понадобится
- VPS с Ubuntu 22.04/24.04 (или аналог), доступ по SSH.
- Домен `nvrskmusic.ru` — доступ к DNS-записям у регистратора.
- Реальные значения `.env` (см. ниже) — токен Telegram-бота для формы заявок.

## 1. Подготовка сервера (один раз)

```bash
apt update && apt upgrade -y
apt install -y docker.io nginx certbot python3-certbot-nginx git
systemctl enable --now docker
```

## 2. DNS

У регистратора `nvrskmusic.ru` создать A-запись, указывающую на IP нового VPS:
```
A   @     <IP_VPS>
A   www   <IP_VPS>
```
Подождать распространения DNS (обычно от нескольких минут до пары часов).

## 3. Код на сервер

```bash
git clone https://github.com/thecruelbaes/redroom-new.git
cd redroom-new
```

## 4. `.env` на сервере

Создать `.env` в корне проекта (значения — реальные, не коммитить):
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
NEXT_PUBLIC_SITE_URL=https://nvrskmusic.ru
NEXT_PUBLIC_YANDEX_VERIFICATION=...   # если нужна верификация в Яндекс.Вебмастере
```

## 5. Собрать и запустить контейнер

```bash
docker build -t redroom-site .
docker run -d --name redroom-site --restart unless-stopped \
  -p 3000:3000 --env-file .env redroom-site
```

Проверить: `curl -I http://localhost:3000` должен вернуть `200`.

## 6. nginx — реверс-прокси

```bash
cp deploy/nginx.conf.example /etc/nginx/sites-available/nvrskmusic.ru
ln -s /etc/nginx/sites-available/nvrskmusic.ru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Проверить: `http://nvrskmusic.ru` должен открыть сайт (пока без HTTPS).

## 7. SSL (HTTPS)

```bash
certbot --nginx -d nvrskmusic.ru -d www.nvrskmusic.ru
```
Certbot сам допишет конфиг nginx (редирект 80→443, сертификат) и настроит автопродление.

## 8. Финальная проверка
- [ ] `https://nvrskmusic.ru` открывается, есть замочек (валидный SSL).
- [ ] Форма на сайте реально долетает до Telegram (`/api/lead`).
- [ ] Открывается с мобильного интернета (не только с сервера/офиса).

## Обновление сайта после изменений (redeploy)

```bash
cd redroom-new
git pull
docker build -t redroom-site .
docker stop redroom-site && docker rm redroom-site
docker run -d --name redroom-site --restart unless-stopped \
  -p 3000:3000 --env-file .env redroom-site
```

## Дальше — Метрика и Директ
Технические шаги выше решают только «сайт открывается на домене». Перенос счётчика
Метрики (109568162) и правки в Директе — отдельные шаги, описаны в
`../RedRoom_Studio_план.md`, разделы 6–7 (шаги 4–5). Их делает владелец в интерфейсах
Яндекса, кода они не касаются.
