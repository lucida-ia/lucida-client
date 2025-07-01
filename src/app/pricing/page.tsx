import { PricingSection } from "@/components/landing/pricing-section";
import { NavBar } from "@/components/layout/navbar";

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full px-16 py-8 h-screen relative bg-black">
      <NavBar />
      {/* Blobs for visual effect, like homepage/faq */}
      <div className="absolute top-40 left-20 w-[400px] h-[400px] bg-cyan-900 rounded-full mix-blend-screen filter blur-3xl opacity-80 animate-blob z-10"></div>
      <div className="absolute top-60 right-60 w-[400px] h-[400px] bg-pink-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-10"></div>
      <div className="absolute bottom-10 left-60 w-[600px] h-[500px] bg-emerald-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-10"></div>
      <div className="flex flex-col w-full h-full rounded-3xl justify-center items-center gap-4">
        <div className="mx-auto w-full mt-8">
          <PricingSection />
        </div>
      </div>
    </div>
  );
}