"use client";

import React from "react";
import { Pie } from "react-chartjs-2";
import { applyChartDefaults } from "./chart-defaults";

type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type DonutProps = {
  slices: DonutSlice[];
  className?: string;
};

export function ShadcnDonut({ slices, className }: DonutProps) {
  React.useEffect(() => {
    applyChartDefaults();
  }, []);

  const chartData = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color),
        borderColor: "transparent",
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className={className} style={{ height: 250 }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}


