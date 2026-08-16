import HeroSection from "@/components/landing/hero-section";
import Features from "@/components/landing/features-4";
import ThreatMap from "@/components/landing/threat-map";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Features />
      <ThreatMap />
      
      <footer className="py-10 bg-slate-50 border-t border-slate-200 text-center text-slate-500 text-sm">
        <p>© 2025 SecureSentinel. All rights reserved.</p>
      </footer>
    </div>
  );
}
