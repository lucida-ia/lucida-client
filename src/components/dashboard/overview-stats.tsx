"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap, Clock } from "lucide-react";

interface UserData {
  user: any;
  classes: any[];
  exams: any[];
}

interface OverviewStatsProps {
  userData: UserData;
  loading: boolean;
}

export function OverviewStats({ userData, loading }: OverviewStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90"
          >
            <CardContent className="flex items-start justify-between p-6">
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Provas",
      value: userData.exams.length,
      icon: <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      description: "Provas criadas",
      color: "blue",
    },
    {
      title: "Tempo Economizado",
      value: `+${Math.floor(
        userData.exams.reduce(
          (acc, exam) => acc + exam.questions.length * 13.5,
          0
        ) / 60
      )}`,
      icon: <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />,
      description: "Horas poupadas",
      color: "green",
    },
    {
      title: "Questões Geradas",
      value: userData.exams.reduce(
        (acc, exam) => acc + exam.questions.length,
        0
      ),
      icon: <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      description: "Questões criadas",
      color: "purple",
    },
    {
      title: "Provas Restantes",
      value: (() => {
        const plan = userData.user?.subscription?.plan || "trial";
        const usage = userData.user?.usage?.examsThisPeriod || 0;

        const limits = {
          trial: 3,
          monthly: 10,
          "semi-annual": 10,
          annual: 10,
          custom: -1, // unlimited
          admin: -1, // unlimited
        };

        const limit = limits[plan as keyof typeof limits] || 3;

        if (limit === -1) {
          return "∞";
        }

        const remaining = Math.max(0, limit - usage);
        return `${remaining}/${limit}`;
      })(),
      icon: <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      description: (() => {
        const plan = userData.user?.subscription?.plan || "trial";
        const planNames = {
          trial: "Plano Grátis",
          "semi-annual": "Plano Semestral",
          annual: "Plano Anual",
          monthly: "Plano Mensal",
          custom: "Plano Personalizado",
          admin: "Plano Admin",
        };
        return planNames[plan as keyof typeof planNames] || "Plano Grátis";
      })(),
      color: "indigo",
    },
    // {
    //   title: "Status da Assinatura",
    //   value: (() => {
    //     const plan = userData.user?.subscription?.plan || "trial";
    //     const status = userData.user?.subscription?.status || "active";

    //     if (plan === "trial") {
    //       return "Trial";
    //     } else if (plan === "semi-annual") {
    //       return "Semi-Anual";
    //     }

    //     switch (status) {
    //       case "active":
    //         return "Ativa";
    //       case "canceled":
    //         return "Cancelada";
    //       case "past_due":
    //         return "Vencida";
    //       default:
    //         return "Inativa";
    //     }
    //   })(),
    //   icon: <Users className="h-5 w-5 text-muted-foreground" />,
    //   description: (() => {
    //     const plan = userData.user?.subscription?.plan || "trial";
    //     const status = userData.user?.subscription?.status || "active";

    //     if (plan === "trial") {
    //       return "Plano gratuito";
    //     } else if (plan === "semi-annual") {
    //       return "Plano básico";
    //     }

    //     const cancelAtPeriodEnd =
    //       userData.user?.subscription?.cancelAtPeriodEnd;
    //     if (cancelAtPeriodEnd) {
    //       return "Cancela ao fim do período";
    //     }

    //     return status === "active" ? "Pagamento em dia" : "Requer ação";
    //   })(),
    // },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90"
        >
          <CardContent className="flex items-start justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                {stat.title}
              </p>
              <div
                className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
              >
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                {stat.description}
              </p>
            </div>
            <div
              className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-lg`}
            >
              {stat.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
