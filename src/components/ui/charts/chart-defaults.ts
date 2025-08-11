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
function hslVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value ? `hsl(${value})` : fallback;
}

export function applyChartDefaults(): void {
  // Global text and borders
  ChartJS.defaults.color = hslVar("--foreground", "#111827");
  ChartJS.defaults.borderColor = hslVar("--border", "#e5e7eb");

  const fontFamily = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-sans")
    .trim();
  ChartJS.defaults.font.family =
    fontFamily || "ui-sans-serif, system-ui, -apple-system";

  // Tooltips (computed from CSS vars so they are theme-aware)
  ChartJS.defaults.plugins.tooltip.backgroundColor = hslVar(
    "--popover",
    "#ffffff"
  );
  ChartJS.defaults.plugins.tooltip.titleColor = hslVar(
    "--popover-foreground",
    "#111827"
  );
  ChartJS.defaults.plugins.tooltip.bodyColor = hslVar(
    "--popover-foreground",
    "#111827"
  );
  ChartJS.defaults.plugins.tooltip.borderColor = hslVar("--border", "#e5e7eb");
  ChartJS.defaults.plugins.tooltip.borderWidth = 1;

  // Legend
  ChartJS.defaults.plugins.legend.labels.color = hslVar(
    "--muted-foreground",
    "#6b7280"
  );
}


