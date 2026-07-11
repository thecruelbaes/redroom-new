/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // защита от clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' }, // запрет MIME-sniffing
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS включается браузером только по HTTPS; на http игнорируется — безопасно держать всегда.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig = {
  // Компактный автономный билд для Docker (копируем только то, что нужно для запуска).
  output: 'standalone',
  // Лендинг — самодостаточный проект внутри монорепо Jarvis; фиксируем корень трейсинга.
  outputFileTracingRoot: import.meta.dirname,
  // Все изображения локальные (public/images) — внешние источники не разрешены.
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false, // убираем X-Powered-By
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
