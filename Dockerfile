# Многоступенчатая сборка Next.js (standalone) — компактный прод-образ.
# Сборка:  docker build -t redroom-site .
# Запуск:  docker run -d --name redroom-site -p 3000:3000 --env-file .env redroom-site
# Реальный трафик — через nginx на хосте (см. deploy/nginx.conf.example), не порт 3000 напрямую.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
