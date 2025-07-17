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
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

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
    name: "Teste Gratis",
    price: "Grátis",
    priceId: "",
    period: "por 30 dias",
    features: [
      "Até 3 provas gratuitas",
      "Máximo 10 questões por prova",
      "Apenas 1 arquivo por upload",
    ],
    popular: false,
    checkoutUrl: "",
    maxExams: 3,
    examFormats: ["simples", "enem"],
    icon: Clock,
    gradient: "from-teal-500 to-cyan-600",
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
      "Geração com IA",
      "Suporte por email",
    ],
    popular: false,
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_SEMESTRAL || "",
    maxExams: 10,
    examFormats: ["simples", "enem"],
    icon: BookOpen,
    gradient: "from-indigo-500 to-purple-600",
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
    ],
    popular: true,
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_ANUAL || "",
    maxExams: 30,
    examFormats: ["simples", "enem"],
    icon: BookMarked,
    gradient: "from-rose-500 to-pink-600",
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
      "Suporte especializado 24/7",
      "Integração com LMS",
    ],
    popular: false,
    checkoutUrl: "",
    maxExams: -1,
    examFormats: ["simples", "enem"],
    icon: GraduationCap,
    gradient: "from-emerald-500 to-green-600",
  },
];

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-200 dark:bg-slate-700" />
        <Skeleton className="h-4 w-96 bg-slate-200 dark:bg-slate-700" />
      </div>
      <Skeleton className="h-48 w-full bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[400px] bg-slate-200 dark:bg-slate-700" />
        <Skeleton className="h-[400px] bg-slate-200 dark:bg-slate-700" />
        <Skeleton className="h-[400px] bg-slate-200 dark:bg-slate-700" />
        <Skeleton className="h-[400px] bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

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
        return "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20 dark:border-green-500/30";
      case "canceled":
        return "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-500/30";
      case "past_due":
        return "bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/30";
      default:
        return "bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/30";
    }
  };

  const getUsagePercentage = () => {
    if (!subscription?.usage || !currentPlan) return 0;
    if (currentPlan.maxExams === -1) return 0; // unlimited
    return (subscription.usage.examsThisPeriod / currentPlan.maxExams) * 100;
  };

  if (loading) {
    return <BillingSkeleton />;
  }

  // Don't render billing page for custom subscription users
  if (subscription && subscription.plan === "custom") {
    return null; // Return null while redirecting
  }

  const currentPlan = getCurrentPlan();
  const usagePercentage = getUsagePercentage();

  return (
    <>
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Gerenciar Assinatura"
          text="Gerencie sua assinatura e acesse recursos premium"
        />
      </div>

      <div className="grid gap-4 md:gap-8">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertDescription className="text-red-700 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Subscription Status */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Plan Overview Card */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentPlan.gradient} opacity-5`}
            ></div>
            <CardContent className="relative p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${currentPlan.gradient} shadow-lg`}
                >
                  <currentPlan.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{currentPlan.name}</h3>
                  {currentPlan.popular && (
                    <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    {currentPlan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {currentPlan.period}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {currentPlan.examFormats.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-lg">Status</h4>
              </div>

              {subscription && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Situação:
                    </span>
                    <Badge
                      className={`${getStatusColor(
                        subscription.status
                      )} border text-sm font-medium`}
                    >
                      {subscription.status === "active"
                        ? "Ativo"
                        : subscription.status}
                    </Badge>
                  </div>

                  {subscription.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Próxima cobrança:
                      </span>
                      <span className="text-sm font-medium">
                        {new Date(
                          subscription.currentPeriodEnd
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}

                  {subscription.cancelAtPeriodEnd &&
                    subscription.currentPeriodEnd && (
                      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                          Cancelamento em{" "}
                          {new Date(
                            subscription.currentPeriodEnd
                          ).toLocaleDateString("pt-BR")}
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 md:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
                  <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h4 className="font-semibold text-lg">Uso do Plano</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Provas este período
                    </span>
                    <span className="text-lg font-bold">
                      {subscription?.usage?.examsThisPeriod || 0}
                      <span className="text-muted-foreground font-normal">
                        /
                        {currentPlan.maxExams === -1
                          ? "∞"
                          : currentPlan.maxExams}
                      </span>
                    </span>
                  </div>
                  {currentPlan.maxExams !== -1 && (
                    <div className="space-y-1">
                      <Progress value={usagePercentage} className="h-3" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>{Math.round(usagePercentage)}% usado</span>
                        <span>{currentPlan.maxExams}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans - Inline Layout */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
              Planos Disponíveis
            </h2>
            <p className="text-muted-foreground text-sm">
              Escolha o plano que melhor se adapta às suas necessidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan.id === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-300 hover:shadow-xl hover:scale-105 border rounded-xl h-full flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${
                    plan.popular
                      ? "shadow-xl ring-2 ring-rose-500/30 border-rose-200 dark:border-rose-700 dark:ring-rose-400/30"
                      : ""
                  } ${
                    isCurrentPlan
                      ? "ring-2 ring-teal-500/40 border-teal-200 dark:border-teal-700 dark:ring-teal-400/40"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap">
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                        Mais Popular
                      </div>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-3 z-20">
                      <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-0 shadow-lg text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Atual
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <div className="text-center mb-4">
                      <div
                        className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                        {plan.name}
                      </CardTitle>
                      <div className="text-3xl font-bold mb-1 text-slate-900 dark:text-slate-100">
                        {plan.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.period}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 flex flex-col flex-1 px-6 pb-6">
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="p-1 rounded-full bg-teal-100 dark:bg-teal-900 mt-0.5 flex-shrink-0">
                            <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          </div>
                          <span className="leading-relaxed text-slate-700 dark:text-slate-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-11 text-sm font-semibold transition-all duration-300 mt-auto ${
                        isCurrentPlan
                          ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-700"
                          : plan.popular
                          ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
                          : plan.id === "trial"
                          ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl"
                          : "bg-gradient-to-r " +
                            plan.gradient +
                            " hover:shadow-lg text-white"
                      }`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrentPlan || processingPlan === plan.id}
                    >
                      {processingPlan === plan.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processando...
                        </div>
                      ) : isCurrentPlan ? (
                        <div className="flex items-center gap-2">
                          <Check className="w-3 h-3" />
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
                        "Entre em contato!"
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
            <Card className="border rounded-lg shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-slate-900 dark:text-slate-100">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  Gerenciar Assinatura
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Controle sua assinatura e histórico de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={handleCustomerPortal}
                    disabled={redirectingToPortal}
                    className="flex-1"
                  >
                    {redirectingToPortal ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Redirecionando...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Gerenciar Pagamentos
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={showCancelConfirmation}
                    disabled={subscription.cancelAtPeriodEnd}
                    className="flex-1"
                  >
                    {subscription.cancelAtPeriodEnd
                      ? "Cancelamento Agendado"
                      : "Cancelar Assinatura"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Confirmation Modal */}
        <AlertDialog open={showCancelModal} onOpenChange={handleModalClose}>
          <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                {isTrialDowngrade
                  ? "Voltar ao Plano Trial"
                  : "Cancelar Assinatura"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400">
                {isTrialDowngrade ? (
                  <>
                    Você tem certeza que deseja voltar ao plano Trial? Sua
                    assinatura atual será cancelada.
                    <br />
                    <br />
                    <strong className="text-slate-900 dark:text-slate-100">
                      O que acontecerá:
                    </strong>
                    <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                      <li>
                        Sua assinatura atual será cancelada ao final do período
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
                    <strong className="text-slate-900 dark:text-slate-100">
                      O que acontecerá:
                    </strong>
                    <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                      <li>
                        Sua assinatura será cancelada ao final do período atual
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
              <AlertDialogCancel
                disabled={cancellingSubscription}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {isTrialDowngrade ? "Manter Plano Atual" : "Manter Assinatura"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
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
    </>
  );
}
