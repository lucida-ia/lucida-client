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

export function GradeBreakdownChart({
  title = "Distribuição por Conceito",
  gradeCounts,
  total,
}: Props) {
  const slices = (Object.keys(gradeCounts) as Array<keyof GradeCounts>)
    .filter((k) => gradeCounts[k] > 0)
    .map((k) => ({
      label: LABELS[k],
      value: gradeCounts[k],
      color: COLORS[k],
    }));

  const hasData = slices.length > 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-title-3 font-semibold">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            <ShadcnDonut slices={slices} />
            <div className="space-y-2 pt-2 border-t border-border/50">
              {slices.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-callout">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1 text-label">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-label">{s.value}</span>
                    <span className="text-tertiary-label">
                      ({((s.value / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-subhead text-secondary-label">
              Nenhum dado disponível para exibir
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
