import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function PricingSection() {
  const plans = [
    {
      name: "Básico",
      description: "Perfeito para educadores individuais e pequenos projetos",
      price: "R$49,90",
      period: "por mês",
      features: [
        "Até 5 provas por mês",
        "Formatos básicos de questões",
        "Geração padrão com IA",
        "Suporte por email",
        "1 conta de usuário"
      ],
      cta: "Começar Agora",
      popular: false
    },
    {
      name: "Pro",
      description: "Ideal para criadores regulares de provas e departamentos",
      price: "R$149,90",
      period: "por mês",
      features: [
        "Até 25 provas por mês",
        "Todos os formatos de questões",
        "Geração avançada com IA",
        "Suporte prioritário por email",
        "Até 5 contas de usuário",
        "Exportação para múltiplos formatos"
      ],
      cta: "Começar Agora",
      popular: true
    },
    {
      name: "Empresarial",
      description: "Para instituições com necessidades extensivas de avaliação",
      price: "R$499,90",
      period: "por mês",
      features: [
        "Provas ilimitadas",
        "Todos os formatos de questões",
        "Geração premium com IA",
        "Suporte prioritário 24/7",
        "Contas de usuário ilimitadas",
        "Integrações personalizadas",
        "Gerente de conta dedicado"
      ],
      cta: "Fale com Vendas",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Planos para Cada Necessidade</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Escolha o plano perfeito para suas necessidades de avaliação. Todos os planos incluem nossa tecnologia central de IA.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 pt-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`flex flex-col rounded-xl p-6 shadow-sm ${
                plan.popular
                  ? "border-2 border-primary bg-background relative"
                  : "border bg-background/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Mais Popular
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mt-4 flex items-baseline text-foreground">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button
                  className={`w-full ${
                    plan.popular ? "bg-primary" : ""
                  }`}
                  asChild
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}