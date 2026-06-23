import type { Metadata, Viewport } from 'next';
import { Oswald, Inter } from 'next/font/google';
import { SITE, SERVICES } from '@/lib/content';
import './globals.css';

const oswald = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RedRoom Studio — уроки барабанов и гитары в Новороссийске',
    template: '%s · RedRoom Studio',
  },
  description: SITE.description,
  keywords: [
    'уроки барабанов Новороссийск',
    'уроки гитары Новороссийск',
    'школа музыки Новороссийск',
    'обучение игре на барабанах',
    'обучение игре на гитаре',
    'репетиционная точка Новороссийск',
    'студия звукозаписи Новороссийск',
    'RedRoom Studio',
    'музыкальная студия Новороссийск',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: SITE.name,
    title: 'RedRoom Studio — уроки барабанов и гитары в Новороссийске',
    description: SITE.description,
    images: [{ url: '/images/hero-guitar.jpg', width: 1280, height: 853, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RedRoom Studio — уроки барабанов и гитары',
    description: SITE.description,
    images: ['/images/hero-guitar.jpg'],
  },
  robots: { index: true, follow: true },
  verification: {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
  icons: { icon: '/images/logo.png', apple: '/images/logo.png' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MusicSchool',
  name: SITE.name,
  image: `${siteUrl}/images/hero-guitar.jpg`,
  '@id': siteUrl,
  url: siteUrl,
  telephone: SITE.phones[0].display,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Новороссийск',
    addressRegion: 'Краснодарский край',
    addressCountry: 'RU',
  },
  areaServed: { '@type': 'City', name: 'Новороссийск' },
  sameAs: [SITE.telegramChannel],
  description: SITE.description,
  makesOffer: SERVICES.map((s) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: s.title },
  })),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${oswald.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
