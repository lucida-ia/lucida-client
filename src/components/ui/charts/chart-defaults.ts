"use client";

import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Register commonly used elements once
ChartJS.register(
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement
);

// Apply defaults that follow shadcn/ui tokens
export function applyChartDefaults(): void {
  // Colors rely on CSS variables so they adapt to theme automatically
  ChartJS.defaults.color = getComputedStyle(document.documentElement)
    .getPropertyValue("--foreground")
    .trim();

  ChartJS.defaults.borderColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--border")
      .trim() || "#e5e7eb";

  ChartJS.defaults.font.family =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-sans")
      .trim() || "ui-sans-serif, system-ui, -apple-system";

  // Tooltips
  ChartJS.defaults.plugins.tooltip.backgroundColor =
    "hsl(var(--popover))";
  ChartJS.defaults.plugins.tooltip.titleColor = "hsl(var(--popover-foreground))";
  ChartJS.defaults.plugins.tooltip.bodyColor = "hsl(var(--popover-foreground))";
  ChartJS.defaults.plugins.tooltip.borderColor = "hsl(var(--border))";
  ChartJS.defaults.plugins.tooltip.borderWidth = 1;

  // Legend
  ChartJS.defaults.plugins.legend.labels.color = "hsl(var(--muted-foreground))";
}


