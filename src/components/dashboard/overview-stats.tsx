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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Provas",
      value: `${userData.exams.length} provas`,
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      description: "Criadas no Lucida",
    },
    {
      title: "Tempo Economizado",
      value: `+${Math.floor(
        userData.exams.reduce(
          (acc, exam) => acc + exam.questions.length * 13.5,
          0
        ) / 60
      )} horas`,
      icon: <Clock className="h-5 w-5 text-muted-foreground" />,
      description: "De tempo economizado",
    },
    {
      title: "Questões Geradas",
      value: `${userData.exams.reduce(
        (acc, exam) => acc + exam.questions.length,
        0
      )} questões`,
      icon: <Zap className="h-5 w-5 text-muted-foreground" />,
      description: "Em todas as provas",
    },
    {
      title: "Provas Restantes",
      value: (() => {
        const plan = userData.user?.subscription?.plan || "trial";
        const usage = userData.user?.usage?.examsThisPeriod || 0;

        const limits = {
          trial: 3,
          "semi-annual": 10,
          annual: 30,
          custom: -1, // unlimited
        };

        const limit = limits[plan as keyof typeof limits] || 3;

        if (limit === -1) {
          return "Ilimitado";
        }

        const remaining = Math.max(0, limit - usage);
        return `${remaining}/${limit}`;
      })(),
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      description: (() => {
        const plan = userData.user?.subscription?.plan || "trial";
        const planNames = {
          trial: "Plano Trial",
          "semi-annual": "Plano Semi-Anual",
          annual: "Plano Anual",
          custom: "Plano Personalizado",
        };
        return planNames[plan as keyof typeof planNames] || "Plano Trial";
      })(),
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
      {stats.map((stat, i) => (
        <Card key={i} className="w-full hover:bg-muted/50 transition-all ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent className="flex flex-col justify-between">
            <div className="text-2xl font-medium">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
