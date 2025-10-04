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
          <Card key={i} className="hover:apple-shadow apple-transition">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <div className="h-10 w-20 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-12 w-12 bg-muted rounded-apple animate-pulse flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Provas Criadas",
      value: userData.exams.length,
      icon: <FileText className="h-6 w-6 text-apple-blue" />,
      description: "Provas criadas",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
    },
    {
      title: "Horas Poupadas",
      value: `+${Math.floor(
        userData.exams.reduce(
          (acc, exam) => acc + exam.questions.length * 13.5,
          0
        ) / 60
      )}`,
      icon: <Clock className="h-6 w-6 text-apple-blue" />,
      description: "",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
    },
    {
      title: "Questões Criadas",
      value: userData.exams.reduce(
        (acc, exam) => acc + exam.questions.length,
        0
      ),
      icon: <Zap className="h-6 w-6 text-apple-blue" />,
      description: "Questões Criadas",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
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
      icon: <Users className="h-6 w-6 text-apple-blue" />,
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
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
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
        <Card key={i} className="hover:apple-shadow apple-transition">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                <div
                  className={`text-large-title font-bold ${stat.textColor} leading-none mb-1`}
                >
                  {stat.value}
                </div>

                <h3 className="text-headline font-semibold text-foreground mt-3">
                  {stat.title}
                </h3>
              </div>
              <div
                className={`p-3 ${stat.bgColor} rounded-apple flex-shrink-0`}
              >
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
