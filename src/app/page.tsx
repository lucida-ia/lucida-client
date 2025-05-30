import { HeroSection } from "@/components/landing/hero-section";
import { FeatureSection } from "@/components/landing/feature-section";
import { TestimonialSection } from "@/components/landing/testimonial-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/layout/footer";
import { NavBar } from "@/components/layout/navbar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col w-full">
      <NavBar />
      <div className="max-w-8xl mx-auto">
        <HeroSection />
        <FeatureSection />
        <TestimonialSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </div>
      <Footer />
    </div>
  );
}
