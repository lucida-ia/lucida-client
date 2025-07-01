import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const plans = [
    {
      name: "Básico",
      description: "Para quem está começando ou tem poucas demandas.",
      price: "R$17,90",
      period: "por mês",
      features: [
        "Até 10 provas por mês",
        "Apenas formato simples de questão",
        "Geração padrão com IA",
        "Suporte por email",
      ],
      cta: "Começar Agora",
      popular: false,
    },
    {
      name: "Pro",
      description: "Para quem precisa de mais flexibilidade e recursos.",
      price: "R$27,90",
      period: "por mês",
      features: [
        "Até 50 provas por mês",
        "Todos os formatos de questões",
        "Geração avançada com IA",
        "Suporte prioritário por email",
      ],
      cta: "Começar Agora",
      popular: true,
    },
    {
      name: "Personalizado",
      description: "Soluções sob medida para grandes demandas ou instituições.",
      price: "",
      period: "Fale com vendas para um plano personalizado",
      features: [
        ,
      ],
      cta: "Entrar em Contato",
      popular: false,
    },
  ];

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center mb-12 px-4 md:px-0">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white mb-4">
          Planos para Cada Necessidade
        </h2>
        <p className="max-w-2xl text-lg text-muted-foreground text-white/80">
          Escolha o plano perfeito para suas necessidades de avaliação. Todos os planos incluem nossa tecnologia central de IA.
        </p>
      </div>
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 px-4 md:px-0">
        {plans.map((plan, idx) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl p-8 shadow-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl ${
              plan.popular ? "border-primary ring-2 ring-primary/30" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
                Mais Popular
              </div>
            )}
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-sm text-white/80 mb-6 min-h-[48px]">{plan.description}</p>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              {plan.period && <span className="text-base text-white/60">{plan.period}</span>}
            </div>
            <ul className="mb-8 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center text-white/90">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary mr-3"></span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className={`w-full h-12 text-base font-semibold mt-auto ${
                plan.popular ? "bg-primary hover:bg-primary/90 shadow-lg" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              }`}
              asChild
            >
              <Link href="/signup">{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}