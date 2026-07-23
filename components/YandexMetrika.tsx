'use client';

import Script from 'next/script';
import { SITE } from '@/lib/content';

declare global {
  interface Window {
    ym?: (counterId: number, action: string, goal?: string) => void;
  }
}

// Официальный сниппет из кабинета Метрики (счётчик перенесён со старого сайта
// nvrskmusic.ru, та же история не теряется — id совпадает). ssr:true + явные
// referrer/url — конфигурация именно под SSR-фреймворки вроде Next.js, не дефолтная.
// strategy="afterInteractive" — не блокирует первый рендер, грузится после гидратации.
export default function YandexMetrika() {
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {
              if (document.scripts[j].src === r) { return; }
            }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${SITE.yandexMetrikaId}", "ym");

          ym(${SITE.yandexMetrikaId}, "init", {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${SITE.yandexMetrikaId}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
