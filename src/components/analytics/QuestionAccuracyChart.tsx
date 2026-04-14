"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import { applyChartDefaults } from "@/components/ui/charts/chart-defaults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export type QuestionAccuracyItem = {
  questionIndex: number;
  accuracy: number;
  subject?: string;
  difficulty?: string;
  totalAnswered: number;
};

type Props = {
  title?: string;
  description?: string;
  questions: QuestionAccuracyItem[];
};

function colorFor(accuracy: number) {
  if (accuracy >= 70) return "#22c55e";
  if (accuracy >= 40) return "#eab308";
  return "#ef4444";
}

export function QuestionAccuracyChart({
  title = "Acertos por Questão",
  description,
  questions,
}: Props) {
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    applyChartDefaults();
  }, []);

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const tickColor = isDark ? "#e5e7eb" : "#374151";

  const hasData = questions.length > 0;

  const chartData = {
    labels: questions.map((q) => `Q${q.questionIndex + 1}`),
    datasets: [
      {
        label: "Acerto (%)",
        data: questions.map((q) => q.accuracy),
        backgroundColor: questions.map((q) => colorFor(q.accuracy)),
        borderRadius: 6,
        barPercentage: 0.75,
        categoryPercentage: 0.8,
      },
    ],
  };

  const dynamicHeight = Math.max(260, Math.min(560, questions.length * 28));

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
          font: { size: 11, family: ChartJS.defaults.font?.family },
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
          title: (items: any) => {
            const idx = items[0]?.dataIndex ?? 0;
            return `Questão ${questions[idx].questionIndex + 1}`;
          },
          label: (ctx: any) => {
            const q = questions[ctx.dataIndex];
            const parts = [`${q.accuracy.toFixed(1)}% de acerto`];
            if (q.subject) parts.push(`Tópico: ${q.subject}`);
            if (q.difficulty) parts.push(`Dificuldade: ${q.difficulty}`);
            parts.push(
              `${q.totalAnswered} ${
                q.totalAnswered === 1 ? "resposta" : "respostas"
              }`
            );
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
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <ListChecks className="h-5 w-5 text-green-600 dark:text-green-400" />
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
          <div className="h-[260px] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
              <ListChecks className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-subhead text-secondary-label">
              Sem dados de acerto por questão
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
