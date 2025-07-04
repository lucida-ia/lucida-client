import { Check, Link } from "lucide-react";
import {
  Card,
  CardDescription,
  CardTitle,
  CardHeader,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";

export const PRICING_PLANS = [
  {
    name: "Grátis",
    description: "Para quem quer testar o produto",
    features: [
      "Até 3 provas por mês",
      "Apenas formato simples de questão",
      "Geração padrão com IA",
    ],
    cta: "Testar Agora!",
    period: "-",
    href: "#",
    priceId: "",
    price: "R$ 0,00",
    duration: "",
    popular: false,
  },
  {
    name: "Pro",
    description: "Para quem precisa de mais flexibilidade e recursos.",
    features: [
      "Até 50 provas por mês",
      "Todos os formatos de questões",
      "Geração avançada com IA",
      "Suporte prioritário por email",
    ],
    cta: "Entrar na Lista de Espera",
    period: "por mês",
    href:
      process.env.NODE_ENV === "development"
        ? "https://buy.stripe.com/test_cNifZa6Zs99UgbZfiwcV201"
        : "",
    priceId:
      process.env.NODE_ENV === "development"
        ? "price_1RgrOp4RuS8yGC3wQUwTYx90"
        : "",
    price: "R$ 27,90",
    duration: "month",
    popular: true,
  },
  {
    name: "Personalizado",
    description: "Soluções sob medida para grandes demandas ou instituições.",
    features: [],
    cta: "Fale com vendas para um plano personalizado",
    period: "Fale com vendas para um plano personalizado",
    href:
      process.env.NODE_ENV === "development"
        ? "https://buy.stripe.com/test_9B600cbfIdqae3R8U8cV200"
        : "",
    priceId:
      process.env.NODE_ENV === "development"
        ? "price_1RgZzc4RuS8yGC3w2EYaA8Ob"
        : "",
    price: "custom",
    duration: "month",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="precos" className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Planos para Cada Necessidade
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Escolha o plano ideal com tecnologia de IA inclusa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan, index) => (
            <Card
              key={index}
              className={`bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 relative flex flex-col ${
                plan.popular
                  ? "border-cyan-500/50 shadow-2xl shadow-cyan-500/25"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-full text-white text-sm font-semibold">
                  Mais Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  {plan.price && (
                    <div className="text-4xl font-bold text-white">
                      {plan.price}
                    </div>
                  )}
                  <div className="text-white/60 text-sm">{plan.period}</div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col justify-between flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-white/90"
                    >
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full text-white mt-6 cursor-pointer ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      : "bg-white/10 hover:bg-white/20 border border-white/20"
                  }`}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
