"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export type SummaryCardItem = {
  label: string;
  value: string | number;
  caption?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "red" | "purple" | "yellow";
};

const COLOR_MAP: Record<
  SummaryCardItem["color"],
  { dot: string; text: string; bgFrom: string; iconBg: string; iconFg: string }
> = {
  blue: {
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    bgFrom: "from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/10",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconFg: "text-blue-600 dark:text-blue-400",
  },
  green: {
    dot: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
    bgFrom: "from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/10",
    iconBg: "bg-green-500/10 dark:bg-green-500/20",
    iconFg: "text-green-600 dark:text-green-400",
  },
  red: {
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    bgFrom: "from-white to-red-50/30 dark:from-gray-900 dark:to-red-950/10",
    iconBg: "bg-red-500/10 dark:bg-red-500/20",
    iconFg: "text-red-600 dark:text-red-400",
  },
  purple: {
    dot: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    bgFrom:
      "from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/10",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
    iconFg: "text-purple-600 dark:text-purple-400",
  },
  yellow: {
    dot: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
    bgFrom:
      "from-white to-yellow-50/30 dark:from-gray-900 dark:to-yellow-950/10",
    iconBg: "bg-yellow-500/10 dark:bg-yellow-500/20",
    iconFg: "text-yellow-600 dark:text-yellow-400",
  },
};

type Props = {
  items: SummaryCardItem[];
};

export function ClassSummaryCards({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        const c = COLOR_MAP[item.color];
        return (
          <Card
            key={i}
            className={`overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br ${c.bgFrom}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <p className="text-footnote font-medium text-secondary-label uppercase tracking-wide">
                      {item.label}
                    </p>
                  </div>
                  <div
                    className={`text-4xl font-bold tracking-tight ${c.text}`}
                  >
                    {item.value}
                  </div>
                  {item.caption && (
                    <p className="text-caption-1 text-tertiary-label">
                      {item.caption}
                    </p>
                  )}
                </div>
                <div
                  className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`h-7 w-7 ${c.iconFg}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
