"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  School,
  BarChart3,
  AlertCircle,
  Gauge,
  Users,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserData {
  user: any;
  classes: any[];
  exams: any[];
  stats?: {
    totalExams: number;
    totalClasses: number;
    examsThisPeriod: number;
  };
}

interface OverviewStatsProps {
  userData: UserData;
  loading: boolean;
  totalSubmissions: number;
  pendingGrading: number;
  studentTotal: number | null;
}

type StatItem = {
  title: string;
  value: number | string;
  icon: ReactNode;
  description: string;
  bgColor: string;
  textColor: string;
  href: string | null;
  /** Tailwind grid span for unified 4-col layout (secondary row) */
  gridClass?: string;
};

export function OverviewStats({
  userData,
  loading,
  totalSubmissions,
  pendingGrading,
  studentTotal,
}: OverviewStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        {[...Array(2)].map((_, i) => (
          <Card
            key={`s-${i}`}
            className="hover:apple-shadow apple-transition lg:col-span-2"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <div className="h-10 w-16 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-12 w-12 bg-muted rounded-apple animate-pulse flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalClasses =
    userData.stats?.totalClasses ?? userData.classes?.length ?? 0;
  const totalExams = userData.stats?.totalExams ?? userData.exams?.length ?? 0;

  const quotaValue = (() => {
    const plan = userData.user?.subscription?.plan || "trial";
    const usage = userData.user?.usage?.examsThisPeriod || 0;

    const limits = {
      trial: 3,
      monthly: 10,
      "semi-annual": 10,
      annual: 10,
      custom: -1,
      admin: -1,
    };

    const limit = limits[plan as keyof typeof limits] ?? 3;

    if (limit === -1) {
      return "∞";
    }

    const remaining = Math.max(0, limit - usage);
    return `${remaining}/${limit}`;
  })();

  const quotaDescription = (() => {
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
  })();

  const primaryStats: StatItem[] = [
    {
      title: "Turmas",
      value: totalClasses,
      icon: <School className="h-6 w-6 text-apple-blue" />,
      description: "Turmas ativas",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
      href: null,
    },
    {
      title: "Submissões",
      value: totalSubmissions,
      icon: <BarChart3 className="h-6 w-6 text-apple-blue" />,
      description: "Respostas registadas",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
      href: null,
    },
    {
      title: "Correções pendentes",
      value: pendingGrading,
      icon: <AlertCircle className="h-6 w-6 text-apple-blue" />,
      description:
        pendingGrading > 0 ? "Precisam de revisão" : "Nada pendente",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
      href: pendingGrading > 0 ? "/dashboard/corrigir" : null,
    },
    {
      title: "Provas restantes",
      value: quotaValue,
      icon: <Gauge className="h-6 w-6 text-apple-blue" />,
      description: quotaDescription,
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
      href: null,
    },
  ];

  const secondaryBase: Omit<StatItem, "href" | "gridClass">[] = [
    ...(studentTotal !== null
      ? [
          {
            title: "Alunos cadastrados",
            value: studentTotal,
            icon: <Users className="h-6 w-6 text-apple-blue" />,
            description: "Na sua conta",
            bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
            textColor: "text-apple-blue",
          },
        ]
      : []),
    {
      title: "Provas criadas",
      value: totalExams,
      icon: <FileText className="h-6 w-6 text-apple-blue" />,
      description: "Total de provas",
      bgColor: "bg-apple-blue/10 dark:bg-apple-blue/20",
      textColor: "text-apple-blue",
    },
  ];

  const secondaryCount = secondaryBase.length;
  const secondarySpanClass =
    secondaryCount <= 1 ? "lg:col-span-4" : "lg:col-span-2";

  const secondaryStats: StatItem[] = secondaryBase.map((s) => ({
    ...s,
    href: null,
    gridClass: secondarySpanClass,
  }));

  const allStats: StatItem[] = [...primaryStats, ...secondaryStats];

  const renderCard = (stat: StatItem, key: string | number) => {
    const inner = (
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
            {stat.description ? (
              <p className="text-caption text-muted-foreground mt-1">
                {stat.description}
              </p>
            ) : null}
          </div>
          <div className={`p-3 ${stat.bgColor} rounded-apple flex-shrink-0`}>
            {stat.icon}
          </div>
        </div>
      </CardContent>
    );

    const cardSurface = cn(
      "hover:apple-shadow apple-transition h-full",
      stat.href ? "cursor-pointer transition-transform hover:scale-[1.01]" : ""
    );

    if (stat.href) {
      return (
        <Link
          key={key}
          href={stat.href}
          className={cn("block min-h-0", stat.gridClass)}
        >
          <Card className={cardSurface}>{inner}</Card>
        </Link>
      );
    }

    return (
      <Card key={key} className={cn(cardSurface, stat.gridClass)}>
        {inner}
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {allStats.map((stat, i) => renderCard(stat, i))}
    </div>
  );
}
