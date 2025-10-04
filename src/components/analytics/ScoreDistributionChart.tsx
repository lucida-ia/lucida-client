"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ShadcnBar } from "@/components/ui/charts/Bar";

type Props = {
  title?: string;
  buckets: { range: string; count: number }[];
};

export function ScoreDistributionChart({
  title = "Distribuição de Notas",
  buckets,
}: Props) {
  const labels = buckets.map((b) => b.range);
  const data = buckets.map((b) => b.count);
  const hasData = data.some((v) => v > 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-title-3 font-semibold">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            <ShadcnBar labels={labels} data={data} className="w-full" />
            <div className="pt-2 border-t border-border/50">
              <p className="text-footnote text-tertiary-label text-center">
                Distribuição por faixa de pontuação
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
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
