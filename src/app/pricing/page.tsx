import { PricingSection } from "@/components/landing/pricing-section";
import { NavBar } from "@/components/layout/navbar";

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full px-16 py-8 h-screen relative bg-black dark">
      <NavBar />
      <div className="absolute top-20 left-40 w-[400px] h-[400px] bg-yellow-900 rounded-full mix-blend-screen filter blur-3xl opacity-80 animate-blob z-10"></div>
      <div className="absolute top-80 right-10 w-[400px] h-[400px] bg-red-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-10"></div>
      <div className="absolute bottom-20 left-40 w-[600px] h-[500px] bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-10"></div>
      <div className="flex flex-col w-full rounded-3xl h-full justify-center items-center gap-4">
        <div className="mx-auto w-full">
          <PricingSection />
        </div>
      </div>
    </div>
  );
}
