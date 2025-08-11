"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Bar as BarChart } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js";
import { applyChartDefaults } from "./chart-defaults";

type BarProps = {
  labels: string[];
  datasetLabel?: string;
  data: number[];
  color?: string; // hex or css var
  className?: string;
};

export function ShadcnBar({
  labels,
  datasetLabel = "Quantidade",
  data,
  color = "#3b82f6",
  className,
}: BarProps) {
  const { resolvedTheme } = useTheme();
  React.useEffect(() => {
    applyChartDefaults();
  }, []);

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";
  const tickColor = isDark ? "#e5e7eb" : "#374151";
  const axisBorder = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)";

  const chartData = {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        backgroundColor: color,
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 12, family: ChartJS.defaults.font?.family } },
        border: { color: axisBorder },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { size: 12, family: ChartJS.defaults.font?.family },
          precision: 0,
        },
        border: { color: axisBorder },
        beginAtZero: true,
        precision: 0,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        // Force white tooltip with dark text for maximum contrast
        backgroundColor: "#ffffff",
        titleColor: "#111827",
        bodyColor: "#111827",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y} aluno${ctx.parsed.y !== 1 ? "s" : ""}`,
        },
      },
    },
  };

  return (
    <div className={className} style={{ height: 300 }}>
      <BarChart key={resolvedTheme} data={chartData} options={options} />
    </div>
  );
}


