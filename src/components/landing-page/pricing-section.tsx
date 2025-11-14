"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileText, Star, Crown } from "lucide-react";

const PRO_PLANS = {
  mensal: {
    id: "monthly",
    name: "Pro",
    price: "R$ 35,00",
    promoPrice: "R$ 1,99",
    period: "por mês",
    features: [
      "Até 10 avaliações por mês",
      "Upload de múltiplos materiais",
      "Todos os formatos de questões",
      "Até 50 questões por avaliação",
      "Sistema anti-fraude para avaliações online",
      "Acesso prioritário a novas ferramentas",
      "Suporte dedicado por email",
    ],
    popular: false,
    maxExams: 10,
    examFormats: ["Simples", "ENEM", "ENADE"],
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MENSAL || "",
    savings: undefined as string | undefined,
    hasPromo: true,
  },
  semestral: {
    id: "semi-annual",
    name: "Pro Semestral",
    price: "R$ 189,90",
    promoPrice: "R$ 1,99",
    period: "por 6 meses",
    features: [
      "Até 10 avaliações por mês",
      "Upload de múltiplos materiais",
      "Todos os formatos de questões",
      "Até 50 questões por avaliação",
      "Sistema anti-fraude para avaliações online",
      "Acesso prioritário a novas ferramentas",
      "Suporte dedicado por email",
    ],
    popular: true,
    maxExams: 10,
    examFormats: ["simples", "enem"],
    icon: Star,
    gradient: "from-indigo-500 to-purple-600",
    savings: "Salve 10%",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_SEMESTRAL || "",
    hasPromo: true,
  },
  anual: {
    id: "annual",
    name: "Pro Anual",
    price: "R$ 334,80",
    promoPrice: "R$ 1,99",
    period: "por ano",
    features: [
      "Até 10 avaliações por mês",
      "Upload de múltiplos materiais",
      "Todos os formatos de questões",
      "Até 50 questões por avaliação",
      "Sistema anti-fraude para avaliações online",
      "Acesso prioritário a novas ferramentas",
      "Suporte dedicado por email",
    ],
    popular: true,
    maxExams: 10,
    examFormats: ["simples", "enem"],
    icon: Crown,
    gradient: "from-rose-500 to-pink-600",
    savings: "Salve 20%",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANUAL || "",
    hasPromo: true,
  },
};

// Helper function to calculate monthly equivalent pricing
const getMonthlyEquivalent = (plan: any) => {
  if (plan.id === "semi-annual") {
    const price = 189.9;
    const months = 6;
    return `(R$ ${(price / months).toFixed(2).replace(".", ",")}/mês)`;
  }
  if (plan.id === "annual") {
    const price = 334.8;
    const months = 12;
    return `(R$ ${(price / months).toFixed(2).replace(".", ",")}/mês)`;
  }
  return "";
};

export function PricingSection() {
  // Function to handle plan selection and redirect to checkout flow
  const handlePlanSelection = (plan: any) => {
    // For paid plans, store plan info and redirect to sign-in
    if (plan.priceId) {
      // Store selected plan information in localStorage
      localStorage.setItem(
        "selectedPlan",
        JSON.stringify({
          priceId: plan.priceId,
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          period: plan.period,
        })
      );

      // Redirect to sign-in page
      window.location.href = "/sign-in";
    }
  };

  return (
    <section
      id="pricing"
      className="relative z-10 px-3 sm:px-4 lg:px-8 py-16 sm:py-32"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Escolha seu Plano
          </h2>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Selecione o período que melhor se adapta às suas necessidades
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Pro Mensal Card */}
          {(() => {
            const plan = PRO_PLANS.mensal;
            return (
              <Card
                className={`relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-slate-800/30 border-slate-700/50 backdrop-blur-sm shadow-lg ${
                  plan.hasPromo
                    ? "ring-1 ring-red-500/20 border-red-500/30"
                    : ""
                }`}
              >
                {plan.hasPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold card-elevation-2">
                      OFERTA ESPECIAL
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4 pt-8">
                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-3 text-white">
                      {plan.name}
                    </CardTitle>
                    {plan.hasPromo ? (
                      <div className="mb-2">
                        <div className="text-lg font-medium text-red-500 line-through mb-1">
                          {plan.price}
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">
                          {plan.promoPrice}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          primeiro mês, depois {plan.price}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold mb-2 text-white">
                        {plan.price}
                      </div>
                    )}
                    <div className="text-sm text-slate-400 font-medium">
                      {plan.period}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-teal-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="leading-relaxed text-slate-300 font-medium">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelection(plan)}
                    className={`w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl ${
                      plan.hasPromo
                        ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r " +
                          plan.gradient +
                          " hover:shadow-lg text-white"
                    }`}
                  >
                    {plan.hasPromo ? "Começar por R$ 1,99" : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })()}

          {/* Pro Semestral Card */}
          {(() => {
            const plan = PRO_PLANS.semestral;
            return (
              <Card
                className={`relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-slate-800/30 border-slate-700/50 backdrop-blur-sm shadow-lg ${
                  plan.hasPromo
                    ? "ring-1 ring-red-500/20 border-red-500/30"
                    : plan.savings
                    ? "ring-1 ring-green-500/20 border-green-500/30"
                    : ""
                }`}
              >
                {plan.hasPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold card-elevation-2">
                      OFERTA ESPECIAL
                    </div>
                  </div>
                )}
                {plan.savings && !plan.hasPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold card-elevation-2">
                      {plan.savings}
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4 pt-8">
                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-3 text-white">
                      {plan.name}
                    </CardTitle>
                    {plan.hasPromo ? (
                      <div className="mb-2">
                        <div className="text-lg font-medium text-red-500 line-through mb-1">
                          {plan.price}
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">
                          {plan.promoPrice}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          primeiro mês, depois {plan.price}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold mb-2 text-white">
                        {plan.price}
                      </div>
                    )}
                    <div className="text-sm text-slate-400 font-medium">
                      {plan.period}
                    </div>
                    {getMonthlyEquivalent(plan) && (
                      <div className="text-sm text-slate-400 mt-1 font-medium">
                        {getMonthlyEquivalent(plan)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-teal-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="leading-relaxed text-slate-300 font-medium">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelection(plan)}
                    className={`w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl ${
                      plan.hasPromo
                        ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
                        : plan.savings
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r " +
                          plan.gradient +
                          " hover:shadow-lg text-white"
                    }`}
                  >
                    {plan.hasPromo ? "Começar por R$ 1,99" : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })()}

          {/* Pro Anual Card */}
          {(() => {
            const plan = PRO_PLANS.anual;
            return (
              <Card
                className={`relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-slate-800/30 border-slate-700/50 backdrop-blur-sm shadow-lg ${
                  plan.hasPromo
                    ? "ring-1 ring-red-500/20 border-red-500/30"
                    : plan.savings
                    ? "ring-1 ring-green-500/20 border-green-500/30"
                    : ""
                }`}
              >
                {plan.hasPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold card-elevation-2">
                      OFERTA ESPECIAL
                    </div>
                  </div>
                )}
                {plan.savings && !plan.hasPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold card-elevation-2">
                      {plan.savings}
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4 pt-8">
                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-3 text-white">
                      {plan.name}
                    </CardTitle>
                    {plan.hasPromo ? (
                      <div className="mb-2">
                        <div className="text-lg font-medium text-red-500 line-through mb-1">
                          {plan.price}
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">
                          {plan.promoPrice}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          primeiro mês, depois {plan.price}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold mb-2 text-white">
                        {plan.price}
                      </div>
                    )}
                    <div className="text-sm text-slate-400 font-medium">
                      {plan.period}
                    </div>
                    {getMonthlyEquivalent(plan) && (
                      <div className="text-sm text-slate-400 mt-1 font-medium">
                        {getMonthlyEquivalent(plan)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="p-1.5 rounded-full bg-teal-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="leading-relaxed text-slate-300 font-medium">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelection(plan)}
                    className={`w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl ${
                      plan.hasPromo
                        ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
                        : plan.savings
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r " +
                          plan.gradient +
                          " hover:shadow-lg text-white"
                    }`}
                  >
                    {plan.hasPromo ? "Começar por R$ 1,99" : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
