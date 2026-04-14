"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Trophy, Users } from "lucide-react";

export type RankingRow = {
  email: string;
  studentName?: string | null;
  primaryValue: number;
  primaryLabel: string;
  secondary?: string;
  extra?: string;
};

type Props = {
  rows: RankingRow[];
  title?: string;
  description?: string;
  initialLimit?: number;
  onRowClick?: (row: RankingRow) => void;
  emptyMessage?: string;
};

function colorFor(value: number) {
  if (value >= 90) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

export function StudentRankingTable({
  rows,
  title = "Ranking de Alunos",
  description,
  initialLimit = 20,
  onRowClick,
  emptyMessage = "Nenhum aluno com resultado registrado",
}: Props) {
  const [limit, setLimit] = React.useState(initialLimit);

  const visible = rows.slice(0, limit);
  const canShowMore = rows.length > limit;

  if (rows.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-subhead text-secondary-label">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-title-3 font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {title}
          </h3>
          {description && (
            <p className="text-footnote text-secondary-label mt-0.5">
              {description}
            </p>
          )}
        </div>
        <span className="text-caption-1 text-tertiary-label">
          {rows.length} {rows.length === 1 ? "aluno" : "alunos"}
        </span>
      </div>

      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {visible.map((row, idx) => {
              const position = idx + 1;
              const clickable = !!onRowClick;
              return (
                <div
                  key={`${row.email}-${idx}`}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={() => clickable && onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (clickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onRowClick?.(row);
                    }
                  }}
                  className={`flex items-center gap-4 p-5 transition-colors ${
                    clickable
                      ? "hover:bg-secondary-system-background/50 cursor-pointer group"
                      : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-callout font-bold shrink-0 ${
                      position === 1
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        : position === 2
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        : position === 3
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                        : "bg-secondary-system-background text-tertiary-label"
                    }`}
                  >
                    {position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-callout font-semibold text-label truncate">
                      {row.studentName || row.email}
                    </p>
                    {row.studentName && (
                      <p className="text-caption-1 text-tertiary-label truncate">
                        {row.email}
                      </p>
                    )}
                    {row.extra && (
                      <p className="text-caption-1 text-tertiary-label truncate mt-0.5">
                        {row.extra}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 justify-end mb-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${colorFor(
                          row.primaryValue
                        )}`}
                      />
                      <span className="text-headline font-bold text-label">
                        {row.primaryValue.toFixed(1)}
                        {row.primaryLabel}
                      </span>
                    </div>
                    {row.secondary && (
                      <p className="text-caption-1 text-tertiary-label">
                        {row.secondary}
                      </p>
                    )}
                  </div>
                  {clickable && (
                    <ChevronRight className="h-4 w-4 text-tertiary-label group-hover:text-label transition-colors shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {canShowMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + initialLimit)}
          >
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}
