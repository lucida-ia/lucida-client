"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import { applyChartDefaults } from "@/components/ui/charts/chart-defaults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export type TopicItem = {
  subject: string;
  accuracy: number;
  questionCount?: number;
  total?: number;
};

type Props = {
  title?: string;
  description?: string;
  topics: TopicItem[];
};

function colorFor(accuracy: number) {
  if (accuracy >= 70) return "#22c55e";
  if (accuracy >= 40) return "#eab308";
  return "#ef4444";
}

export function TopicBreakdownChart({
  title = "Desempenho por Tópico",
  description,
  topics,
}: Props) {
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    applyChartDefaults();
  }, []);

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const tickColor = isDark ? "#e5e7eb" : "#374151";

  const hasData = topics.length > 0;

  const chartData = {
    labels: topics.map((t) => t.subject),
    datasets: [
      {
        label: "Acerto (%)",
        data: topics.map((t) => t.accuracy),
        backgroundColor: topics.map((t) => colorFor(t.accuracy)),
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
    ],
  };

  const dynamicHeight = Math.max(240, Math.min(520, topics.length * 48));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { size: 11, family: ChartJS.defaults.font?.family },
          callback: (v: any) => `${v}%`,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 12, family: ChartJS.defaults.font?.family },
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
          label: (ctx: any) => {
            const t = topics[ctx.dataIndex];
            const parts = [`${t.accuracy.toFixed(1)}% de acerto`];
            const n = t.questionCount ?? t.total;
            if (n) parts.push(`${n} ${n === 1 ? "questão" : "questões"}`);
            return parts;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-title-3 font-semibold">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          {title}
        </CardTitle>
        {description && (
          <p className="text-footnote text-secondary-label">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div style={{ height: dynamicHeight }}>
            <Bar key={resolvedTheme} data={chartData} options={options} />
          </div>
        ) : (
          <div className="h-[240px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-subhead text-secondary-label text-center px-4">
              Questões desta prova ainda não têm tópicos definidos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
