import { StatsBar } from '@/components/StatsBar';
import { LandingHero } from '@/components/LandingHero';
import { FeaturesSection } from '@/components/FeaturesSection';
import { LiveLaunches } from '@/components/LiveLaunches';

/**
 * Landing Page Component
 *
 * Showcases the ZumpFun platform with:
 * - Real-time stats bar
 * - Hero section with animated CTAs
 * - Feature highlights
 * - Live token launches feed
 */
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      <StatsBar />
      <LandingHero />
      <FeaturesSection />
      <LiveLaunches />

      {/* Footer CTA */}
      <footer className="relative py-24 bg-gradient-to-t from-[#0A0B0D] via-[#111318] to-transparent border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Launch Your Token?
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of creators launching privacy-first tokens on ZumpFun
          </p>
          <button className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-lg rounded-xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
            Get Started Now
          </button>
        </div>
      </footer>
    </div>
  );
}
