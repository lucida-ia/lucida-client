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
      <div className="grid gap-4 grid-cols-4 w-full">
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
      title: "Assinatura",
      value: userData.user?.subscription || "Ativo",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
      description: userData.user?.subscription || "Sua assinatura está ativa",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-4 w-full">
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
