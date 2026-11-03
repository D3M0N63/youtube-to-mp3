import { AudioDownloaderHero } from "@/components/AudioDownloaderHero";
import { FaqSection } from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <AudioDownloaderHero />
        <HowItWorksSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
