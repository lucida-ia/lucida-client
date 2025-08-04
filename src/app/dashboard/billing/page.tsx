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
  savings?: string;
}

type PeriodType = "mensal" | "semestral" | "anual";

const PERIOD_OPTIONS: { value: PeriodType; label: string; savings?: string }[] = [
  { value: "mensal", label: "Mensal" },
  { value: "semestral", label: "Semestral", savings: "Salve 10%" },
  { value: "anual", label: "Anual", savings: "Salve 20%" },
];

const GRATIS_PLAN: PricingPlan = {
  id: "gratis",
  name: "Gratis",
    price: "Grátis",
    priceId: "",
    period: "",
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
};

const PERSONALIZADO_PLAN: PricingPlan = {
  id: "personalizado",
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
};

const PRO_PLANS: Record<PeriodType, PricingPlan> = {
  mensal: {
    id: "pro-mensal",
    name: "Pro",
    price: "R$ 35,00",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MENSAL || "",
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
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_MENSAL || "",
    maxExams: 10,
    examFormats: ["Simples", "ENEM", "ENADE"],
    icon: Calendar,
    gradient: "from-blue-500 to-indigo-600",
  },
  semestral: {
    id: "pro-semestral",
    name: "Pro Semestral",
    price: "R$ 189,90",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_SEMESTRAL || "",
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
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_SEMESTRAL || "",
    maxExams: 10,
    examFormats: ["simples", "enem"],
    icon: BookOpen,
    gradient: "from-indigo-500 to-purple-600",
    savings: "Salve 10%",
  },
  anual: {
    id: "pro-anual",
    name: "Pro Anual",
    price: "R$ 334,80",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANUAL || "",
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
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_PRICE_URL_PRO_ANUAL || "",
    maxExams: 10,
    examFormats: ["simples", "enem"],
    icon: BookMarked,
    gradient: "from-rose-500 to-pink-600",
    savings: "Salve 20%",
  },
};

// Helper function to calculate monthly equivalent pricing
const getMonthlyEquivalent = (plan: PricingPlan) => {
  if (plan.id === "pro-semestral") {
    const price = 189.9;
    const months = 6;
    return `(R$ ${(price / months).toFixed(2).replace(".", ",")}/mês)`;
  }
  if (plan.id === "pro-anual") {
    const price = 334.8;
    const months = 12;
    return `(R$ ${(price / months).toFixed(2).replace(".", ",")}/mês)`;
  }
  return "";
};

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-200 dark:bg-slate-700" />
        <Skeleton className="h-4 w-96 bg-slate-200 dark:bg-slate-700" />
      </div>
      <Skeleton className="h-48 w-full bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("mensal");

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
      if (plan.id === "gratis") {
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
            "Você já está no plano Grátis ou não possui uma assinatura ativa."
          );
          setProcessingPlan(null);
          return;
        }
      }

      if (plan.priceId && plan.id !== "personalizado") {
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
    if (!subscription) return GRATIS_PLAN; // Default to trial plan
    return (
      [GRATIS_PLAN, PRO_PLANS.mensal, PRO_PLANS.semestral, PRO_PLANS.anual, PERSONALIZADO_PLAN].find((plan) => plan.id === subscription.plan) ||
      GRATIS_PLAN
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
  const currentProPlan = PRO_PLANS[selectedPeriod];

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
                {getMonthlyEquivalent(currentPlan) && (
                  <div className="text-sm text-muted-foreground">
                    {getMonthlyEquivalent(currentPlan)}
                  </div>
                )}
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

        {/* Period Selector */}
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
              Escolha seu Plano
            </h2>
            <p className="text-muted-foreground">
              Selecione o período que melhor se adapta às suas necessidades
            </p>
          </div>

          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedPeriod === option.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                {option.label}
                {option.savings && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">
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
          <Card className="relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-4 pt-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                  Gratis
                </CardTitle>
                <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                  Grátis
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Para começar
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
              <ul className="space-y-4 mb-8 flex-1">
                {GRATIS_PLAN.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-full bg-teal-100 dark:bg-teal-900 mt-0.5 flex-shrink-0">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl ${
                  currentPlan.id === "gratis"
                    ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-700"
                    : "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl"
                }`}
                onClick={() => handleSubscribe(GRATIS_PLAN)}
                disabled={currentPlan.id === "gratis" || processingPlan === "gratis"}
              >
                {processingPlan === "gratis" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : currentPlan.id === "gratis" ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Plano Atual
                  </div>
                ) : (
                  "Começar Grátis"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Card */}
          <Card className={`relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg ${
            currentProPlan.savings && currentProPlan.id !== "pro-mensal"
              ? "shadow-2xl ring-2 ring-green-500/30 border-green-200 dark:border-green-700 dark:ring-green-400/30 transform scale-105"
                      : ""
                  } ${
            currentPlan.id === currentProPlan.id
                      ? "ring-2 ring-teal-500/40 border-teal-200 dark:border-teal-700 dark:ring-teal-400/40"
                      : ""
          }`}>
            {currentProPlan.savings && currentProPlan.id !== "pro-mensal" && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                  <Sparkles className="w-4 h-4 mr-2 inline" />
                  {currentProPlan.savings}
                      </div>
                    </div>
                  )}

            {currentPlan.id === currentProPlan.id && (
              <div className="absolute -top-3 right-4 z-20">
                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-0 shadow-lg">
                  <Check className="w-4 h-4 mr-1" />
                        Atual
                      </Badge>
                    </div>
                  )}

            <CardHeader className="pb-4 pt-8">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${currentProPlan.gradient} flex items-center justify-center shadow-lg`}>
                  <currentProPlan.icon className="w-8 h-8 text-white" />
                      </div>
                <CardTitle className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                  Pro
                      </CardTitle>
                <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                  {currentProPlan.price}
                      </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {currentProPlan.period}
                      </div>
                {getMonthlyEquivalent(currentProPlan) && (
                  <div className="text-sm text-muted-foreground mt-1 font-medium">
                    {getMonthlyEquivalent(currentProPlan)}
                        </div>
                      )}
                    </div>
                  </CardHeader>

            <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
              <ul className="space-y-4 mb-8 flex-1">
                {currentProPlan.features.map((feature, index) => (
                        <li
                          key={index}
                    className="flex items-start gap-3"
                        >
                    <div className="p-1.5 rounded-full bg-teal-100 dark:bg-teal-900 mt-0.5 flex-shrink-0">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          </div>
                    <span className="leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                className={`w-full h-12 font-semibold transition-all duration-300 mt-auto rounded-xl ${
                  currentPlan.id === currentProPlan.id
                          ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-700"
                    : currentProPlan.savings && currentProPlan.id !== "pro-mensal"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                          : "bg-gradient-to-r " +
                      currentProPlan.gradient +
                            " hover:shadow-lg text-white"
                      }`}
                onClick={() => handleSubscribe(currentProPlan)}
                disabled={currentPlan.id === currentProPlan.id || processingPlan === currentProPlan.id}
                    >
                {processingPlan === currentProPlan.id ? (
                        <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Processando...
                        </div>
                ) : currentPlan.id === currentProPlan.id ? (
                        <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                          Plano Atual
                        </div>
                      ) : (
                        "Assinar Agora"
                      )}
                    </Button>
                  </CardContent>
                </Card>

          {/* Personalizado Card */}
          <Card className="relative transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border rounded-2xl h-full flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader className="pb-4 pt-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
          </div>
                <CardTitle className="text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                  Personalizado
                </CardTitle>
                <div className="text-4xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                  Sob consulta
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Para empresas
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex flex-col flex-1 px-8 pb-8">
              <ul className="space-y-4 mb-8 flex-1">
                {PERSONALIZADO_PLAN.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-full bg-teal-100 dark:bg-teal-900 mt-0.5 flex-shrink-0">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-12 font-semibold transition-all duration-300 mt-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl rounded-xl"
                onClick={() => handleSubscribe(PERSONALIZADO_PLAN)}
                disabled={processingPlan === "personalizado"}
              >
                {processingPlan === "personalizado" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : (
                  "Entre em contato!"
                )}
              </Button>
            </CardContent>
          </Card>
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
                    Você tem certeza que deseja voltar ao plano Grátis? Sua
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
                        plano Grátis
                      </li>
                      <li>No plano Grátis você terá até 3 provas gratuitas</li>
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
