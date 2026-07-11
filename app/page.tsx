import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Why from '@/components/Why';
import HowItWorks from '@/components/HowItWorks';
import Teachers from '@/components/Teachers';
import Studio from '@/components/Studio';
import TrialCta from '@/components/TrialCta';
import Reviews from '@/components/Reviews';
import Faq from '@/components/Faq';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import FloatingCta from '@/components/FloatingCta';
import TelegramFab from '@/components/TelegramFab';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Why />
        <HowItWorks />
        <Teachers />
        <Studio />
        <TrialCta />
        <Reviews />
        <Faq />
        <ContactForm />
      </main>
      <Footer />
      <FloatingCta />
      <TelegramFab />
    </>
  );
}
