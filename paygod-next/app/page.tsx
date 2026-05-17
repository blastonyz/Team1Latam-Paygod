"use client";

import { NavbarMarketing } from "@/components/ui/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import Providers from "@/components/providers";

export default function HomePage() {
  return (
    <Providers>
      <div className="min-h-screen bg-black text-white">
        <NavbarMarketing />
        <main>
          <Hero />
          <SocialProof />
          <Features />
          <HowItWorks />
          <CTASection />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
