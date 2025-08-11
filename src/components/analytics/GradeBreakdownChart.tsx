"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { ShadcnDonut } from "@/components/ui/charts/Donut";

type GradeCounts = {
  excellent: number;
  good: number;
  satisfactory: number;
  needsImprovement: number;
  unsatisfactory: number;
};

type Props = {
  title?: string;
  gradeCounts: GradeCounts;
  total: number;
};

const COLORS = {
  excellent: "#22c55e",
  good: "#84cc16",
  satisfactory: "#eab308",
  needsImprovement: "#f97316",
  unsatisfactory: "#ef4444",
};

const LABELS = {
  excellent: "Excelente (90-100%)",
  good: "Bom (80-89%)",
  satisfactory: "Satisfatório (70-79%)",
  needsImprovement: "Precisa Melhorar (60-69%)",
  unsatisfactory: "Insatisfatório (0-59%)",
};

export function GradeBreakdownChart({ title = "Distribuição por Conceito", gradeCounts, total }: Props) {
  const slices = (Object.keys(gradeCounts) as Array<keyof GradeCounts>)
    .filter((k) => gradeCounts[k] > 0)
    .map((k) => ({ label: LABELS[k], value: gradeCounts[k], color: COLORS[k] }));

  const hasData = slices.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ShadcnDonut slices={slices} />
            <div className="mt-4 space-y-2">
              {slices.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1">{s.label}</span>
                  <span className="font-medium">{s.value} aluno{s.value !== 1 ? "s" : ""}</span>
                  <span className="text-muted-foreground">({((s.value / total) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para exibir
          </div>
        )}
      </CardContent>
    </Card>
  );
}


