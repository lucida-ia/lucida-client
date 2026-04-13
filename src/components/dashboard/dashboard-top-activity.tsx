"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";

export interface AnalyticsExamSummary {
  id: string;
  title: string;
  className: string;
  submissionCount: number;
}

interface DashboardTopActivityProps {
  exams: AnalyticsExamSummary[];
  loading: boolean;
}

export function DashboardTopActivity({
  exams,
  loading,
}: DashboardTopActivityProps) {
  if (loading) {
    return (
      <Card className="hover:apple-shadow apple-transition">
        <CardHeader>
          <CardTitle className="text-title-2">Provas com mais atividade</CardTitle>
          <CardDescription>Ordenadas por número de submissões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (exams.length === 0) {
    return null;
  }

  return (
    <Card className="hover:apple-shadow apple-transition">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-title-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-apple-blue" />
            Provas com mais atividade
          </CardTitle>
          <CardDescription>Ordenadas por número de submissões</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">
                {exam.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {exam.className} · {exam.submissionCount}{" "}
                {exam.submissionCount === 1 ? "submissão" : "submissões"}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link
                href={`/dashboard/analytics/${exam.id}`}
                className="gap-1"
              >
                Ver análise
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
