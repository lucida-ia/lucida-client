"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Clock,
  FileText,
  Star,
  Crown,
  GraduationCap,
} from "lucide-react";

// Period options
const PERIOD_OPTIONS = [
  { value: "mensal" as const, label: "Mensal" },
  { value: "semestral" as const, label: "Semestral", savings: "Salve 10%" },
  { value: "anual" as const, label: "Anual", savings: "Salve 20%" },
];

// Pricing plans
const GRATIS_PLAN = {
  id: "gratis",
  name: "Gratis",
  price: "Grátis",
  period: "",
  features: [
    "Até 3 provas gratuitas",
    "Máximo 10 questões por prova",
    "Apenas 1 arquivo por upload",
  ],
  popular: false,
  maxExams: 3,
  examFormats: ["Simples", "ENEM"],
  icon: Clock,
  gradient: "from-teal-500 to-cyan-600",
  priceId: "",
};

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

const PERSONALIZADO_PLAN = {
  id: "personalizado",
  name: "Personalizado",
  price: "Sob consulta",
  period: "",
  features: [
    "Provas ilimitadas",
    "Todos os formatos de questões",
    "Geração avançada com IA",
    "Suporte especializado 24/7",
    "Integração com LMS",
  ],
  popular: false,
  maxExams: -1,
  examFormats: ["simples", "enem"],
  icon: GraduationCap,
  gradient: "from-emerald-500 to-green-600",
  priceId: "",
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
  const [selectedPeriod, setSelectedPeriod] = useState<
    "mensal" | "semestral" | "anual"
  >("mensal");

  // Function to handle plan selection and redirect to checkout flow
  const handlePlanSelection = (plan: any) => {
    if (plan.id === "personalizado") {
      // For custom plan, just scroll to contact section
      document
        .getElementById("contact")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (plan.id === "gratis") {
      // For free plan, redirect directly to sign-up
      window.location.href = "/sign-up";
      return;
    }

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

        {/* Period Selector */}
        <div className="flex flex-col items-center space-y-6 mb-12 sm:mb-16">
          <div className="inline-flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 shadow-inner">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedPeriod === option.value
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {option.label}
                {option.savings && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-900/50 text-green-400 rounded-full">
                    {option.savings}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Gratis Card */}
          <Card className="relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-slate-800/30 border-slate-700/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4 pt-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold mb-3 text-white">
                  Gratis
                </CardTitle>
                <div className="text-4xl font-bold mb-2 text-white">Grátis</div>
                <div className="text-sm text-slate-400 font-medium">
                  Para começar
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
              <ul className="space-y-4 mb-8 flex-1">
                {GRATIS_PLAN.features.map((feature, index) => (
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
                onClick={() => handlePlanSelection(GRATIS_PLAN)}
                className="w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl"
              >
                Começar Grátis
              </Button>
            </CardContent>
          </Card>

          {/* Pro Card */}
          {(() => {
            const currentProPlan = PRO_PLANS[selectedPeriod];
            return (
              <Card
                className={`relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-slate-800/30 border-slate-700/50 backdrop-blur-sm shadow-lg ${
                  currentProPlan.hasPromo
                    ? "ring-1 ring-red-500/20 border-red-500/30"
                    : currentProPlan.savings && currentProPlan.id !== "monthly"
                    ? "ring-1 ring-green-500/20 border-green-500/30"
                    : ""
                }`}
              >
                {currentProPlan.hasPromo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      OFERTA ESPECIAL
                    </div>
                  </div>
                )}
                {currentProPlan.savings &&
                  currentProPlan.id !== "monthly" &&
                  !currentProPlan.hasPromo && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        {currentProPlan.savings}
                      </div>
                    </div>
                  )}

                <CardHeader className="pb-4 pt-8">
                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${currentProPlan.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <currentProPlan.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-3 text-white">
                      {currentProPlan.name}
                    </CardTitle>
                    {currentProPlan.hasPromo ? (
                      <div className="mb-2">
                        <div className="text-lg font-medium text-red-500 line-through mb-1">
                          {currentProPlan.price}
                        </div>
                        <div className="text-4xl font-bold text-white mb-1">
                          {currentProPlan.promoPrice}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          primeiro mês, depois {currentProPlan.price}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold mb-2 text-white">
                        {currentProPlan.price}
                      </div>
                    )}
                    {/* <div className="text-sm text-slate-400 font-medium">
                      {currentProPlan.period}
                    </div> */}
                    {getMonthlyEquivalent(currentProPlan) && (
                      <div className="text-sm text-slate-400 mt-1 font-medium">
                        {getMonthlyEquivalent(currentProPlan)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
                  <ul className="space-y-4 mb-8 flex-1">
                    {currentProPlan.features.map((feature, index) => (
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
                    onClick={() => handlePlanSelection(currentProPlan)}
                    className={`w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl ${
                      currentProPlan.hasPromo
                        ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl"
                        : currentProPlan.savings &&
                          currentProPlan.id !== "monthly"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r " +
                          currentProPlan.gradient +
                          " hover:shadow-lg text-white"
                    }`}
                  >
                    {currentProPlan.hasPromo
                      ? "Começar por R$ 1,99"
                      : "Assinar Agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })()}

          {/* Personalizado Card */}
          <Card className="relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-slate-800/30 border-slate-700/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4 pt-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold mb-3 text-white">
                  Personalizado
                </CardTitle>
                <div className="text-4xl font-bold mb-2 text-white">
                  Sob consulta
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  Para instituições
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
              <ul className="space-y-4 mb-8 flex-1">
                {PERSONALIZADO_PLAN.features.map((feature, index) => (
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
                onClick={() => handlePlanSelection(PERSONALIZADO_PLAN)}
                className="w-full h-12 font-semibold transition-all duration-300 mt-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl rounded-xl"
              >
                Entre em contato!
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
