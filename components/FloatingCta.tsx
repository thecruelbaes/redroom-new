'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from './Icons';

export default function FloatingCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const contact = document.getElementById('contact');
    let contactVisible = false;
    const update = () => setShow(window.scrollY > 600 && !contactVisible);
    const io = contact
      ? new IntersectionObserver(
          (entries) => {
            contactVisible = entries[0].isIntersecting;
            update();
          },
          { rootMargin: '0px 0px -25% 0px' },
        )
      : null;
    io?.observe(contact!);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      io?.disconnect();
    };
  }, []);

  return (
    <a
      href="#contact"
      aria-label="Записаться на бесплатное пробное занятие"
      className={`btn-red fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300 cursor-pointer md:hidden ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      Записаться
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}
