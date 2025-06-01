"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap, Clock } from "lucide-react";

interface UserData {
  totalExams: number;
  totalExamsCreatedThisMonth: any[];
  totalQuestions: number;
}

export function OverviewStats() {
  const [userData, setUserData] = useState<UserData>({
    totalExams: 0,
    totalExamsCreatedThisMonth: [],
    totalQuestions: 0,
  });

  useEffect(() => {
    const storedData = localStorage.getItem("user");
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  const stats = [
    {
      title: "Total de Provas",
      value: userData.totalExams,
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
      description: `${userData.totalExamsCreatedThisMonth.length} provas criadas este mês`,
    },
    {
      title: "Tempo Economizado",
      value: userData.totalQuestions,
      icon: <Clock className="h-5 w-5 text-muted-foreground" />,
      description: "Tempo estimado economizado",
    },
    {
      title: "Questões Geradas",
      value: userData.totalQuestions,
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
