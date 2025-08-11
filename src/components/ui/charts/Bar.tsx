"use client";

import React from "react";
import { Bar as BarChart } from "react-chartjs-2";
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
  React.useEffect(() => {
    applyChartDefaults();
  }, []);

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
        ticks: { color: "hsl(var(--muted-foreground))" },
      },
      y: {
        grid: { color: "hsl(var(--border))" },
        ticks: { color: "hsl(var(--muted-foreground))" },
        beginAtZero: true,
        precision: 0,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className={className} style={{ height: 300 }}>
      <BarChart data={chartData} options={options} />
    </div>
  );
}


