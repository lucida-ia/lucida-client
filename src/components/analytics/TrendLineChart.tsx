"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import { applyChartDefaults } from "@/components/ui/charts/chart-defaults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export type TrendPoint = {
  label: string;
  value: number;
  date?: string | Date;
  highlight?: boolean;
};

type Props = {
  title?: string;
  description?: string;
  points: TrendPoint[];
  height?: number;
};

export function TrendLineChart({
  title = "Evolução",
  description,
  points,
  height = 280,
}: Props) {
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    applyChartDefaults();
  }, []);

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const tickColor = isDark ? "#e5e7eb" : "#374151";
  const line = "#3b82f6";
  const highlight = "#f59e0b";

  const hasData = points.length > 0;

  const chartData = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label: "Média (%)",
        data: points.map((p) => p.value),
        borderColor: line,
        backgroundColor: "rgba(59,130,246,0.18)",
        fill: true,
        tension: 0.35,
        pointRadius: points.map((p) => (p.highlight ? 6 : 4)),
        pointBackgroundColor: points.map((p) =>
          p.highlight ? highlight : line
        ),
        pointBorderColor: points.map((p) => (p.highlight ? highlight : line)),
        borderWidth: 2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 11, family: ChartJS.defaults.font?.family },
          maxRotation: 30,
          autoSkip: true,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { size: 11, family: ChartJS.defaults.font?.family },
          callback: (v: any) => `${v}%`,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#ffffff",
        titleColor: "#111827",
        bodyColor: "#111827",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-title-3 font-semibold">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          {title}
        </CardTitle>
        {description && (
          <p className="text-footnote text-secondary-label">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div style={{ height }}>
            <Line key={resolvedTheme} data={chartData} options={options} />
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center"
            style={{ height }}
          >
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-gray-600 dark:text-gray-400" />
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
