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
import { ContactModal } from "@/components/contact-modal";

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

const PERIOD_OPTIONS: { value: PeriodType; label: string; savings?: string }[] =
  [
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
  examFormats: ["Simples", "ENEM"],
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

const ADMIN_PLAN: PricingPlan = {
  id: "admin",
  name: "Admin",
  price: "—",
  priceId: "",
  period: "",
  features: [
    "Provas ilimitadas",
    "Todos os formatos de questões",
    "Acesso total ao painel e faturamento",
  ],
  popular: false,
  checkoutUrl: "",
  maxExams: -1,
  examFormats: ["simples", "enem", "enade"],
  icon: Shield,
  gradient: "from-slate-500 to-slate-700",
};

const PRO_PLANS: Record<PeriodType, PricingPlan> = {
  mensal: {
    id: "monthly",
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
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
  },
  semestral: {
    id: "semi-annual",
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
    icon: Star,
    gradient: "from-indigo-500 to-purple-600",
    savings: "Salve 10%",
  },
  anual: {
    id: "annual",
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
    icon: Crown,
    gradient: "from-rose-500 to-pink-600",
    savings: "Salve 20%",
  },
};

// Helper function to calculate monthly equivalent pricing
const getMonthlyEquivalent = (plan: PricingPlan) => {
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

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 bg-[rgb(var(--apple-gray-5))] dark:bg-[rgb(var(--apple-gray-5))]" />
        <Skeleton className="h-5 w-96 bg-[rgb(var(--apple-gray-5))] dark:bg-[rgb(var(--apple-gray-5))]" />
      </div>
      <Skeleton className="h-48 w-full bg-[rgb(var(--apple-gray-5))] dark:bg-[rgb(var(--apple-gray-5))]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[400px] bg-[rgb(var(--apple-gray-5))] dark:bg-[rgb(var(--apple-gray-5))]" />
        <Skeleton className="h-[400px] bg-[rgb(var(--apple-gray-5))] dark:bg-[rgb(var(--apple-gray-5))]" />
        <Skeleton className="h-[400px] bg-[rgb(var(--apple-gray-5))] dark:bg-[rgb(var(--apple-gray-5))]" />
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
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  // Redirect users with custom subscription away from billing page (admins can access)
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
      // Get current plan for comparison
      const currentPlanForCheck = getCurrentPlan();

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
        // Check if user is already on this plan
        if (currentPlanForCheck.id === plan.id) {
          setError("Você já está neste plano.");
          setProcessingPlan(null);
          return;
        }

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
            errorData.details ||
              errorData.error ||
              "Failed to create checkout session"
          );
        }

        const responseData = await response.json();

        if (responseData.url) {
          window.location.href = responseData.url;
        } else {
          throw new Error("No checkout URL received");
        }
      } else {
        // Handle custom plan - show contact modal
        setShowContactModal(true);
        setProcessingPlan(null);
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

    // Map "trial" to "gratis" for plan matching
    const planId = subscription.plan === "trial" ? "gratis" : subscription.plan;

    return (
      [
        GRATIS_PLAN,
        PRO_PLANS.mensal,
        PRO_PLANS.semestral,
        PRO_PLANS.anual,
        PERSONALIZADO_PLAN,
        ADMIN_PLAN,
      ].find((plan) => plan.id === planId) || GRATIS_PLAN
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
    if (currentPlan.maxExams === -1 || subscription.plan === "admin") return 0; // unlimited
    return (subscription.usage.examsThisPeriod / currentPlan.maxExams) * 100;
  };

  if (loading) {
    return <BillingSkeleton />;
  }

  // Don't render billing page for custom subscription users (admins can access)
  if (subscription && subscription.plan === "custom") {
    return null; // Return null while redirecting
  }

  const currentPlan = getCurrentPlan();
  const usagePercentage = getUsagePercentage();

  return (
    <>
      {currentPlan !== GRATIS_PLAN && (
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Gerenciar Assinatura"
            text="Gerencie sua assinatura e acesse recursos premium"
          />
        </div>
      )}

      <div className="grid gap-4 md:gap-8">
        {error && (
          <Alert className="border-[rgb(var(--apple-red)/0.2)] bg-[rgb(var(--apple-red)/0.1)] dark:border-[rgb(var(--apple-red)/0.3)] dark:bg-[rgb(var(--apple-red)/0.15)] apple-shadow-sm">
            <AlertDescription className="text-[rgb(var(--apple-red))] dark:text-[rgb(var(--apple-red))] text-subhead">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {subscription?.plan !== "trial" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Plan Overview Card */}
            <Card className="relative overflow-hidden border-[rgb(var(--apple-gray-4))] bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))] apple-shadow apple-transition">
              <CardContent className="relative p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-r ${currentPlan.gradient}`}
                  >
                    <currentPlan.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-headline text-[rgb(var(--apple-label))]">
                      {currentPlan.name}
                    </h3>
                    {currentPlan.popular && (
                      <Badge className="mt-1 bg-[rgb(var(--apple-pink))] text-white border-0 text-caption-1">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-title-1 font-semibold text-[rgb(var(--apple-label))]">
                      {currentPlan.price}
                    </span>
                    <span className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                      {currentPlan.period}
                    </span>
                  </div>
                  {getMonthlyEquivalent(currentPlan) && (
                    <div className="text-footnote text-[rgb(var(--apple-tertiary-label))]">
                      {getMonthlyEquivalent(currentPlan)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {currentPlan.examFormats.map((format) => (
                      <Badge
                        key={format}
                        variant="outline"
                        className="text-caption-1 border-[rgb(var(--apple-gray-3))]"
                      >
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="border-[rgb(var(--apple-gray-4))] bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))] apple-shadow apple-transition">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[rgb(var(--apple-blue)/0.15)]">
                    <Shield className="w-5 h-5 text-[rgb(var(--apple-blue))]" />
                  </div>
                  <h4 className="text-headline text-[rgb(var(--apple-label))]">
                    Status
                  </h4>
                </div>

                {subscription && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                        Situação:
                      </span>
                      <Badge
                        className={`${getStatusColor(
                          subscription.status
                        )} border text-caption-1 font-medium`}
                      >
                        {subscription.status === "active"
                          ? "Ativo"
                          : subscription.status}
                      </Badge>
                    </div>

                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center justify-between">
                        <span className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                          Próxima cobrança:
                        </span>
                        <span className="text-subhead font-medium text-[rgb(var(--apple-label))]">
                          {new Date(
                            subscription.currentPeriodEnd
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    {subscription.cancelAtPeriodEnd &&
                      subscription.currentPeriodEnd && (
                        <Alert className="border-[rgb(var(--apple-orange)/0.3)] bg-[rgb(var(--apple-orange)/0.1)] dark:border-[rgb(var(--apple-orange)/0.4)] dark:bg-[rgb(var(--apple-orange)/0.15)] apple-shadow-sm">
                          <Calendar className="w-4 h-4 text-[rgb(var(--apple-orange))]" />
                          <AlertDescription className="text-[rgb(var(--apple-orange))] text-footnote">
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
            <Card className="border-[rgb(var(--apple-gray-4))] bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))] apple-shadow apple-transition md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[rgb(var(--apple-blue)/0.15)]">
                    <TrendingUp className="w-5 h-5 text-[rgb(var(--apple-blue))]" />
                  </div>
                  <h4 className="text-headline text-[rgb(var(--apple-label))]">
                    Uso do Plano
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                        Provas este período
                      </span>
                      <span className="text-title-3 font-semibold text-[rgb(var(--apple-label))]">
                        {subscription?.usage?.examsThisPeriod || 0}
                        <span className="text-subhead text-[rgb(var(--apple-secondary-label))] font-normal">
                          /
                          {currentPlan.maxExams === -1
                            ? "∞"
                            : currentPlan.maxExams}
                        </span>
                      </span>
                    </div>
                    {currentPlan.maxExams !== -1 && (
                      <div className="space-y-2">
                        <Progress value={usagePercentage} className="h-2" />
                        <div className="flex justify-between text-caption-2 text-[rgb(var(--apple-tertiary-label))]">
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
        )}
        {/* Current Subscription Status */}

        <div className="flex flex-col items-center space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-title-1 font-semibold text-[rgb(var(--apple-label))]">
              {subscription?.plan === "trial"
                ? "Escolha seu Plano"
                : "Alterar Plano"}
            </h2>
            <p className="text-body text-[rgb(var(--apple-secondary-label))]">
              {subscription?.plan === "trial"
                ? "Selecione o período que melhor se adapta às suas necessidades"
                : "Escolha um novo plano para alterar sua assinatura"}
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {/* Mensal Card */}
          {(() => {
            const mensalPlan = PRO_PLANS.mensal;
            return (
              <Card
                className={`relative apple-transition hover:apple-shadow-lg border-[rgb(var(--apple-gray-4))] rounded-2xl h-full flex flex-col bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))] apple-shadow ${
                  currentPlan.id === mensalPlan.id
                    ? "ring-2 ring-[rgb(var(--apple-blue)/0.4)] border-[rgb(var(--apple-blue)/0.5)]"
                    : ""
                }`}
              >
                {currentPlan.id === mensalPlan.id && (
                  <div className="absolute -top-2.5 right-4 z-20">
                    <Badge className="bg-[rgb(var(--apple-blue))] text-white border-0 card-elevation-2 text-caption-1">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Atual
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3 pt-6">
                  <div className="text-center space-y-3">
                    <CardTitle className="text-title-2 font-semibold text-[rgb(var(--apple-label))]">
                      Mensal
                    </CardTitle>
                    <div className="text-title-1 font-bold text-[rgb(var(--apple-label))]">
                      {mensalPlan.price}
                    </div>
                    <div className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                      {mensalPlan.period}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-6 pb-6">
                  <ul className="space-y-3 mb-6 flex-1">
                    {mensalPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <div className="p-1 rounded-full bg-[rgb(var(--apple-blue)/0.15)] mt-0.5 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-[rgb(var(--apple-blue))]" />
                        </div>
                        <span className="text-subhead text-[rgb(var(--apple-label))]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 font-semibold apple-transition mt-auto rounded-xl text-subhead ${
                      currentPlan.id === mensalPlan.id
                        ? "bg-[rgb(var(--apple-blue)/0.1)] text-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.15)] border border-[rgb(var(--apple-blue)/0.3)]"
                        : "bg-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.9)] text-white apple-shadow"
                    }`}
                    onClick={() => handleSubscribe(mensalPlan)}
                    disabled={
                      currentPlan.id === mensalPlan.id ||
                      processingPlan === mensalPlan.id
                    }
                  >
                    {processingPlan === mensalPlan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </div>
                    ) : currentPlan.id === mensalPlan.id ? (
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
            );
          })()}

          {/* Semestral Card */}
          {(() => {
            const semestralPlan = PRO_PLANS.semestral;
            return (
              <Card
                className={`relative apple-transition hover:apple-shadow-lg border-[rgb(var(--apple-gray-4))] rounded-2xl h-full flex flex-col bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))] apple-shadow ${
                  semestralPlan.savings
                    ? "ring-2 ring-[rgb(var(--apple-green)/0.4)] border-[rgb(var(--apple-green)/0.5)]"
                    : ""
                } ${
                  currentPlan.id === semestralPlan.id
                    ? "ring-2 ring-[rgb(var(--apple-blue)/0.4)] border-[rgb(var(--apple-blue)/0.5)]"
                    : ""
                }`}
              >
                {semestralPlan.savings && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-[rgb(var(--apple-blue))] text-white px-3 py-1.5 rounded-full text-caption-1 font-bold card-elevation-2 whitespace-nowrap">
                      {semestralPlan.savings}
                    </div>
                  </div>
                )}

                {currentPlan.id === semestralPlan.id && (
                  <div className="absolute -top-2.5 right-4 z-20">
                    <Badge className="bg-[rgb(var(--apple-blue))] text-white border-0 card-elevation-2 text-caption-1">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Atual
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3 pt-6">
                  <div className="text-center space-y-3">
                    <CardTitle className="text-title-1 font-semibold text-[rgb(var(--apple-label))]">
                      Semestral
                    </CardTitle>
                    <div className="text-title-1 font-bold text-[rgb(var(--apple-label))]">
                      {semestralPlan.price}
                    </div>
                    <div className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                      {semestralPlan.period}
                    </div>
                    {getMonthlyEquivalent(semestralPlan) && (
                      <div className="text-footnote text-[rgb(var(--apple-tertiary-label))]">
                        {getMonthlyEquivalent(semestralPlan)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-6 pb-6">
                  <ul className="space-y-3 mb-6 flex-1">
                    {semestralPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <div className="p-1 rounded-full bg-[rgb(var(--apple-blue)/0.15)] mt-0.5 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-[rgb(var(--apple-blue))]" />
                        </div>
                        <span className="text-subhead text-[rgb(var(--apple-label))]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 font-semibold apple-transition mt-auto rounded-xl text-subhead ${
                      currentPlan.id === semestralPlan.id
                        ? "bg-[rgb(var(--apple-blue)/0.1)] text-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.15)] border border-[rgb(var(--apple-blue)/0.3)]"
                        : "bg-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.9)] text-white apple-shadow"
                    }`}
                    onClick={() => handleSubscribe(semestralPlan)}
                    disabled={
                      currentPlan.id === semestralPlan.id ||
                      processingPlan === semestralPlan.id
                    }
                  >
                    {processingPlan === semestralPlan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </div>
                    ) : currentPlan.id === semestralPlan.id ? (
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
            );
          })()}

          {/* Anual Card */}
          {(() => {
            const anualPlan = PRO_PLANS.anual;
            return (
              <Card
                className={`relative apple-transition hover:apple-shadow-lg border-[rgb(var(--apple-gray-4))] rounded-2xl h-full flex flex-col bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))] apple-shadow ${
                  anualPlan.savings
                    ? "ring-2 ring-[rgb(var(--apple-green)/0.4)] border-[rgb(var(--apple-green)/0.5)]"
                    : ""
                } ${
                  currentPlan.id === anualPlan.id
                    ? "ring-2 ring-[rgb(var(--apple-blue)/0.4)] border-[rgb(var(--apple-blue)/0.5)]"
                    : ""
                }`}
              >
                {anualPlan.savings && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-[rgb(var(--apple-blue))] text-white px-3 py-1.5 rounded-full text-caption-1 font-bold card-elevation-2 whitespace-nowrap">
                      {anualPlan.savings}
                    </div>
                  </div>
                )}

                {currentPlan.id === anualPlan.id && (
                  <div className="absolute -top-2.5 right-4 z-20">
                    <Badge className="bg-[rgb(var(--apple-blue))] text-white border-0 card-elevation-2 text-caption-1">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Atual
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3 pt-6">
                  <div className="text-center space-y-3">
                    <CardTitle className="text-title-2 font-semibold text-[rgb(var(--apple-label))]">
                      Anual
                    </CardTitle>
                    <div className="text-title-1 font-bold text-[rgb(var(--apple-label))]">
                      {anualPlan.price}
                    </div>
                    <div className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                      {anualPlan.period}
                    </div>
                    {getMonthlyEquivalent(anualPlan) && (
                      <div className="text-footnote text-[rgb(var(--apple-tertiary-label))]">
                        {getMonthlyEquivalent(anualPlan)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex flex-col flex-1 px-6 pb-6">
                  <ul className="space-y-3 mb-6 flex-1">
                    {anualPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <div className="p-1 rounded-full bg-[rgb(var(--apple-blue)/0.15)] mt-0.5 flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-[rgb(var(--apple-blue))]" />
                        </div>
                        <span className="text-subhead text-[rgb(var(--apple-label))]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-11 font-semibold apple-transition mt-auto rounded-xl text-subhead ${
                      currentPlan.id === anualPlan.id
                        ? "bg-[rgb(var(--apple-blue)/0.1)] text-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.15)] border border-[rgb(var(--apple-blue)/0.3)]"
                        : "bg-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.9)] text-white apple-shadow"
                    }`}
                    onClick={() => handleSubscribe(anualPlan)}
                    disabled={
                      currentPlan.id === anualPlan.id ||
                      processingPlan === anualPlan.id
                    }
                  >
                    {processingPlan === anualPlan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </div>
                    ) : currentPlan.id === anualPlan.id ? (
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
            );
          })()}
        </div>
        {/* Period Selector */}

        {/* Subscription Management */}
        {subscription &&
          subscription.status === "active" &&
          subscription.plan !== "trial" &&
          subscription.plan !== "semi-annual" &&
          subscription.plan !== "admin" && (
            <Card className="border-[rgb(var(--apple-gray-4))] rounded-2xl apple-shadow bg-[rgb(var(--apple-secondary-grouped-background))] dark:border-[rgb(var(--apple-gray-4))] dark:bg-[rgb(var(--apple-secondary-grouped-background))]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-headline text-[rgb(var(--apple-label))]">
                  <div className="p-2 rounded-lg bg-[rgb(var(--apple-blue)/0.15)]">
                    <Shield className="w-4 h-4 text-[rgb(var(--apple-blue))]" />
                  </div>
                  Gerenciar Assinatura
                </CardTitle>
                <CardDescription className="text-subhead text-[rgb(var(--apple-secondary-label))]">
                  Controle sua assinatura e histórico de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCustomerPortal}
                    disabled={redirectingToPortal}
                    className="flex-1 h-11 text-subhead font-medium border-[rgb(var(--apple-blue)/0.3)] text-[rgb(var(--apple-blue))] hover:bg-[rgb(var(--apple-blue)/0.1)] hover:border-[rgb(var(--apple-blue)/0.5)]"
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
                    className="flex-1 h-11 text-subhead font-medium"
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
          <AlertDialogContent className="bg-[rgb(var(--apple-secondary-grouped-background))] border-[rgb(var(--apple-gray-4))] apple-shadow-lg">
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="flex items-center gap-2 text-title-3 font-semibold text-[rgb(var(--apple-label))]">
                <Shield className="w-5 h-5 text-[rgb(var(--apple-red))]" />
                {isTrialDowngrade
                  ? "Voltar ao Plano Trial"
                  : "Cancelar Assinatura"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body text-[rgb(var(--apple-secondary-label))] leading-relaxed">
                {isTrialDowngrade ? (
                  <>
                    Você tem certeza que deseja voltar ao plano Grátis? Sua
                    assinatura atual será cancelada.
                    <br />
                    <br />
                    <strong className="text-headline text-[rgb(var(--apple-label))]">
                      O que acontecerá:
                    </strong>
                    <ul className="mt-3 list-disc list-inside text-subhead text-[rgb(var(--apple-secondary-label))] space-y-1.5">
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
                    <strong className="text-headline text-[rgb(var(--apple-label))]">
                      O que acontecerá:
                    </strong>
                    <ul className="mt-3 list-disc list-inside text-subhead text-[rgb(var(--apple-secondary-label))] space-y-1.5">
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
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                disabled={cancellingSubscription}
                className="bg-[rgb(var(--apple-secondary-grouped-background))] text-[rgb(var(--apple-label))] border-[rgb(var(--apple-gray-4))] hover:bg-[rgb(var(--apple-gray-6))] h-11 text-subhead font-medium"
              >
                {isTrialDowngrade ? "Manter Plano Atual" : "Manter Assinatura"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="bg-[rgb(var(--apple-red))] hover:bg-[rgb(var(--apple-red)/0.9)] text-white h-11 text-subhead font-medium"
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

        {/* Contact Modal */}
        <ContactModal
          open={showContactModal}
          onOpenChange={setShowContactModal}
        />
      </div>
    </>
  );
}
