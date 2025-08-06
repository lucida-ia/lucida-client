"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/layout/navbar";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

// Import all landing page components
import {
  HeroSection,
  VideoDemoSection,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  FAQSection,
  ContactSection,
  FinalCTASection,
  FooterSection,
} from "@/components/landing-page";

export default function Home() {
  const { isSignedIn, user } = useUser();

  // Navbar scroll state
  const [isScrolled, setIsScrolled] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isSignedIn && user) {
      redirect("/dashboard");
    }
  }, [isSignedIn, user]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show loading state while checking authentication
  if (isSignedIn && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden text-white dark">
      {/* Enhanced Background Effects - Optimized for mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Orbs - Smaller on mobile */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>

        {/* Grid Pattern - Responsive sizing */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] sm:bg-[size:24px_24px]"></div>
      </div>

      {/* Modern Floating Navigation - Mobile optimized */}
      <div
        className={`fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-50 transition-all duration-500 ${
          isScrolled
            ? "translate-y-0 opacity-100"
            : "translate-y-1 sm:translate-y-2 opacity-90"
        }`}
      >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl py-2 shadow-2xl max-w-5xl mx-auto px-2 sm:px-4">
          <NavBar />
        </div>
      </div>

      <HeroSection />
      <VideoDemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
      <FinalCTASection />
      <FooterSection />
    </div>
  );
}
