"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  CreditCard,
  Calendar,
  Users,
  Zap,
  Crown,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Shield,
  Star,
  FileText,
  Clock,
  BookOpen,
  BookMarked,
  GraduationCap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usage?: {
    examsThisPeriod: number;
    examsThisPeriodResetDate: Date;
  };
}

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: string;
  priceId: string;
  period: string;
  features: string[];
  popular: boolean;
  checkoutUrl: string;
  maxExams: number;
  examFormats: string[];
  icon: any;
  gradient: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "trial",
    name: "Trial",
    price: "Grátis",
    priceId: "",
    period: "por 30 dias",
    features: [
      "Até 3 provas gratuitas",
      "Máximo 10 questões por prova",
      "Apenas 1 arquivo por upload",
      "Todos os formatos de questões",
      "Geração avançada com IA",
      "Suporte por email",
      "Histórico de provas",
      "Exportação em PDF",
    ],
    popular: false,
    checkoutUrl: "",
    maxExams: 3,
    examFormats: ["simples", "enem", "dissertativa"],
    icon: Clock,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "semi-annual",
    name: "Semestral",
    price: "R$ 189,90",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_SEMESTRAL || "",
    period: "por 6 meses",
    features: [
      "Até 10 provas por semestre",
      "Todos os formatos de questões",
      "Geração avançada com IA",
      "Suporte prioritário por email",
      "Histórico de provas",
      "Exportação em PDF",
    ],
    popular: false,
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_SEMESTRAL || "",
    maxExams: 10,
    examFormats: ["simples", "enem", "dissertativa"],
    icon: BookOpen,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    id: "annual",
    name: "Anual",
    price: "R$ 334,80",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANUAL || "",
    period: "por ano",
    features: [
      "Até 30 provas por ano",
      "Todos os formatos de questões",
      "Geração avançada com IA",
      "Suporte prioritário por email",
      "Histórico de provas",
      "Exportação em PDF",
    ],
    popular: true,
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_ANUAL || "",
    maxExams: 30,
    examFormats: ["simples", "enem", "dissertativa"],
    icon: BookMarked,
    gradient: "from-blue-500 to-purple-600",
  },
  {
    id: "custom",
    name: "Personalizado",
    price: "Sob consulta",
    priceId: "",
    period: "",
    features: [
      "Provas ilimitadas",
      "Todos os formatos de questões",
      "Geração avançada com IA",
      "Suporte prioritário 24/7",
      "Integração com LMS",
      "Treinamento personalizado",
      "Gestão de equipes",
    ],
    popular: false,
    checkoutUrl: "",
    maxExams: -1, // unlimited
    examFormats: ["simples", "enem", "dissertativa", "personalizada"],
    icon: GraduationCap,
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function BillingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [isTrialDowngrade, setIsTrialDowngrade] = useState(false);
  const [redirectingToPortal, setRedirectingToPortal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  // Redirect users with custom subscription away from billing page
  useEffect(() => {
    if (subscription && subscription.plan === "custom") {
      router.push("/dashboard");
    }
  }, [subscription, router]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) return;

    setProcessingPlan(plan.id);

    try {
      // Handle trial plan - cancel current subscription if user has one
      if (plan.id === "trial") {
        if (
          subscription?.stripeSubscriptionId &&
          subscription.status === "active" &&
          subscription.plan !== "trial"
        ) {
          // Show cancel confirmation modal for trial "downgrade"
          setIsTrialDowngrade(true);
          setShowCancelModal(true);
          setProcessingPlan(null);
          return;
        } else {
          // User is already on trial or has no active subscription
          setError(
            "Você já está no plano Trial ou não possui uma assinatura ativa."
          );
          setProcessingPlan(null);
          return;
        }
      }

      if (plan.priceId && plan.id !== "custom") {
        // Create dynamic checkout session
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: plan.priceId,
            planId: plan.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details || "Failed to create checkout session"
          );
        }

        const responseData = await response.json();

        if (responseData.url) {
          window.location.href = responseData.url;
        } else {
          throw new Error("No checkout URL received");
        }
      } else {
        // Handle custom plan - redirect to contact
        window.location.href = "/contact";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;

    try {
      setCancellingSubscription(true);
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      await fetchSubscription();
      setShowCancelModal(false);
      setIsTrialDowngrade(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCancellingSubscription(false);
    }
  };

  const showCancelConfirmation = () => {
    setIsTrialDowngrade(false);
    setShowCancelModal(true);
  };

  const handleModalClose = (open: boolean) => {
    setShowCancelModal(open);
    if (!open) {
      setIsTrialDowngrade(false);
    }
  };

  const handleCustomerPortal = async () => {
    if (!user) return;

    setRedirectingToPortal(true);

    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create customer portal session"
        );
      }

      const data = await response.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRedirectingToPortal(false);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return PRICING_PLANS[0]; // Default to trial plan
    return (
      PRICING_PLANS.find((plan) => plan.id === subscription.plan) ||
      PRICING_PLANS[0]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "canceled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "past_due":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getUsagePercentage = () => {
    if (!subscription?.usage || !currentPlan) return 0;
    if (currentPlan.maxExams === -1) return 0; // unlimited
    return (subscription.usage.examsThisPeriod / currentPlan.maxExams) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-5 w-96 mb-8" />
            </div>
            <div className="grid gap-8">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="grid lg:grid-cols-3 gap-8">
                <Skeleton className="h-[500px] w-full rounded-2xl" />
                <Skeleton className="h-[500px] w-full rounded-2xl" />
                <Skeleton className="h-[500px] w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render billing page for custom subscription users
  if (subscription && subscription.plan === "custom") {
    return null; // Return null while redirecting
  }

  const currentPlan = getCurrentPlan();
  const usagePercentage = getUsagePercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                  Gerenciar Assinatura
                </h1>
                <p className="text-lg text-slate-600">
                  Gerencie sua assinatura e acesse recursos premium
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Subscription Status */}
          <Card className="mb-12 border-0 shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div
                  className={`p-2 rounded-xl bg-gradient-to-r ${currentPlan.gradient}`}
                >
                  <currentPlan.icon className="w-6 h-6 text-white" />
                </div>
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Plan Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-bold">
                          {currentPlan.name}
                        </h3>
                        {currentPlan.popular && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600">
                        {currentPlan.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      {currentPlan.price}
                    </span>
                    <span className="text-slate-500">{currentPlan.period}</span>
                  </div>
                </div>

                {/* Status & Usage */}
                <div className="space-y-6">
                  {subscription && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">
                          Status:
                        </span>
                        <Badge
                          className={`${getStatusColor(
                            subscription.status
                          )} border`}
                        >
                          {subscription.status === "active"
                            ? "Ativo"
                            : subscription.status}
                        </Badge>
                      </div>

                      {subscription.currentPeriodEnd && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">
                            Próxima cobrança:
                          </span>
                          <span className="text-slate-600 font-medium">
                            {new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}

                      {subscription.cancelAtPeriodEnd &&
                        subscription.currentPeriodEnd && (
                          <Alert className="border-amber-200 bg-amber-50">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            <AlertDescription className="text-amber-700">
                              Sua assinatura será cancelada em{" "}
                              {new Date(
                                subscription.currentPeriodEnd
                              ).toLocaleDateString("pt-BR")}
                            </AlertDescription>
                          </Alert>
                        )}
                    </div>
                  )}

                  {/* Usage Statistics */}
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Uso do Plano
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">
                            Provas este mês
                          </span>
                          <span className="font-medium text-slate-900">
                            {subscription?.usage?.examsThisPeriod || 0} /{" "}
                            {currentPlan.maxExams === -1
                              ? "∞"
                              : currentPlan.maxExams}
                          </span>
                        </div>
                        {currentPlan.maxExams !== -1 && (
                          <Progress
                            value={usagePercentage}
                            className="h-2"
                            style={
                              {
                                "--progress-background":
                                  usagePercentage > 80
                                    ? "#ef4444"
                                    : usagePercentage > 60
                                    ? "#f59e0b"
                                    : "#10b981",
                              } as React.CSSProperties
                            }
                          />
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-slate-600">
                          Formatos disponíveis:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {currentPlan.examFormats.map((format) => (
                            <Badge
                              key={format}
                              variant="secondary"
                              className="text-xs"
                            >
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div className="mb-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Planos Disponíveis
              </h2>
              <p className="text-lg text-slate-600">
                Escolha o plano que melhor se adapta às suas necessidades
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {PRICING_PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = currentPlan.id === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-visible transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-0 flex flex-col h-full ${
                      plan.popular
                        ? "shadow-2xl ring-2 ring-blue-500/20 bg-gradient-to-b from-white to-blue-50/30"
                        : "shadow-lg bg-white/70 backdrop-blur-sm"
                    } ${
                      isCurrentPlan
                        ? "ring-2 ring-green-500/30 bg-gradient-to-b from-white to-green-50/20"
                        : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                          <Sparkles className="w-3 h-3 mr-1 inline" />
                          Mais Popular
                        </div>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-4 right-4 z-20">
                        <Badge className="bg-green-500 text-white border-0 shadow-lg">
                          <Check className="w-3 h-3 mr-1" />
                          Atual
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4 pt-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-3 rounded-2xl bg-gradient-to-r ${plan.gradient}`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl font-bold">
                            {plan.name}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="mb-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">
                            {plan.price}
                          </div>
                          <div className="text-sm text-slate-500">
                            {plan.period}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1">
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 text-sm"
                          >
                            <div className="p-1 rounded-full bg-green-100 mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full h-12 text-base font-semibold transition-all duration-300 mt-auto ${
                          isCurrentPlan
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                            : plan.popular
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white"
                        }`}
                        onClick={() => handleSubscribe(plan)}
                        disabled={isCurrentPlan || processingPlan === plan.id}
                      >
                        {processingPlan === plan.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Processando...
                          </div>
                        ) : isCurrentPlan ? (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Plano Atual
                          </div>
                        ) : plan.id === "trial" ? (
                          subscription?.stripeSubscriptionId &&
                          subscription.status === "active" &&
                          subscription.plan !== "trial" ? (
                            "Voltar ao Trial"
                          ) : (
                            "Plano Atual"
                          )
                        ) : plan.id === "semi-annual" ? (
                          "Usar Semestral"
                        ) : plan.id === "custom" ? (
                          "Entre em contato agora!"
                        ) : (
                          "Assinar Agora"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Subscription Management */}
          {subscription &&
            subscription.status === "active" &&
            subscription.plan !== "trial" &&
            subscription.plan !== "semi-annual" && (
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-slate-500 to-slate-600">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    Gerenciar Assinatura
                  </CardTitle>
                  <CardDescription className="text-base">
                    Controle sua assinatura e histórico de pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Button
                      variant="outline"
                      onClick={handleCustomerPortal}
                      disabled={redirectingToPortal}
                      className="w-full sm:w-auto h-12 text-base hover:bg-slate-100 transition-colors"
                    >
                      {redirectingToPortal ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Redirecionando...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Gerenciar Pagamentos
                        </>
                      )}
                    </Button>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <Shield className="w-4 h-4" />
                        <h4 className="font-semibold">Zona de Perigo</h4>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={showCancelConfirmation}
                        disabled={subscription.cancelAtPeriodEnd}
                        className="w-full sm:w-auto h-12 text-base"
                      >
                        {subscription.cancelAtPeriodEnd
                          ? "Cancelamento Agendado"
                          : "Cancelar Assinatura"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Confirmation Modal */}
          <AlertDialog open={showCancelModal} onOpenChange={handleModalClose}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  {isTrialDowngrade
                    ? "Voltar ao Plano Trial"
                    : "Cancelar Assinatura"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  {isTrialDowngrade ? (
                    <>
                      Você tem certeza que deseja voltar ao plano Trial? Sua
                      assinatura atual será cancelada.
                      <br />
                      <br />
                      <strong>O que acontecerá:</strong>
                      <ul className="mt-2 list-disc list-inside text-sm text-slate-600">
                        <li>
                          Sua assinatura atual será cancelada ao final do
                          período
                        </li>
                        <li>
                          Você continuará tendo acesso aos recursos premium até{" "}
                          {subscription?.currentPeriodEnd &&
                            new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString("pt-BR")}
                        </li>
                        <li>
                          Após esta data, você voltará automaticamente para o
                          plano Trial
                        </li>
                        <li>No plano Trial você terá até 3 provas gratuitas</li>
                        <li>
                          Você pode reativar sua assinatura a qualquer momento
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      Você tem certeza que deseja cancelar sua assinatura? Esta
                      ação não pode ser desfeita.
                      <br />
                      <br />
                      <strong>O que acontecerá:</strong>
                      <ul className="mt-2 list-disc list-inside text-sm text-slate-600">
                        <li>
                          Sua assinatura será cancelada ao final do período
                          atual
                        </li>
                        <li>
                          Você continuará tendo acesso aos recursos premium até{" "}
                          {subscription?.currentPeriodEnd &&
                            new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString("pt-BR")}
                        </li>
                        <li>
                          Após esta data, você voltará para o plano gratuito
                        </li>
                        <li>
                          Você pode reativar sua assinatura a qualquer momento
                        </li>
                      </ul>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancellingSubscription}>
                  {isTrialDowngrade
                    ? "Manter Plano Atual"
                    : "Manter Assinatura"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  disabled={cancellingSubscription}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cancellingSubscription ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {isTrialDowngrade ? "Voltando..." : "Cancelando..."}
                    </div>
                  ) : isTrialDowngrade ? (
                    "Sim, Voltar ao Trial"
                  ) : (
                    "Sim, Cancelar Assinatura"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
