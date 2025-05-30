import { PricingSection } from '@/components/landing/pricing-section';

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Choose the Perfect Plan for Your Needs
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          All plans include our core AI technology with varying levels of features and support.
        </p>
      </div>
      <PricingSection />
    </div>
  );
}