"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap, Clock } from "lucide-react";

export function OverviewStats() {
  // Mock data - would come from an API in a real application
  const stats = [
    {
      title: "Total de Provas",
      value: "12",
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      description: "3 criadas este mês",
    },
    {
      title: "Tempo Economizado",
      value: "24h",
      icon: <Clock className="h-5 w-5 text-muted-foreground" />,
      description: "Tempo estimado economizado",
    },
    {
      title: "Questões Geradas",
      value: "238",
      icon: <Zap className="h-5 w-5 text-muted-foreground" />,
      description: "Em todas as provas",
    },
    // {
    //   title: "Assinatura",
    //   value: user?.subscription || "Período de Teste",
    //   icon: <Users className="h-5 w-5 text-muted-foreground" />,
    //   description: user?.subscription ? "Ativa" : "7 dias restantes",
    // },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
