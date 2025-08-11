"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ShadcnBar } from "@/components/ui/charts/Bar";

type Props = {
  title?: string;
  buckets: { range: string; count: number }[];
};

export function ScoreDistributionChart({ title = "Distribuição de Notas", buckets }: Props) {
  const labels = buckets.map((b) => b.range);
  const data = buckets.map((b) => b.count);
  const hasData = data.some((v) => v > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ShadcnBar labels={labels} data={data} className="w-full" />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para exibir
          </div>
        )}
      </CardContent>
    </Card>
  );
}


