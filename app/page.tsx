import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Why from '@/components/Why';
import Teachers from '@/components/Teachers';
import Studio from '@/components/Studio';
import TrialCta from '@/components/TrialCta';
import Reviews from '@/components/Reviews';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import FloatingCta from '@/components/FloatingCta';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Why />
        <Teachers />
        <Studio />
        <TrialCta />
        <Reviews />
        <ContactForm />
      </main>
      <Footer />
      <FloatingCta />
    </>
  );
}
