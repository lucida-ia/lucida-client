"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  User,
  Clock,
  ImageIcon,
  CircleDot,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanResultCardProps {
  scan: {
    scanId: string;
    studentId: string | null | { value: string | null; isValid?: boolean };
    studentCodeValid?: boolean;
    studentCodeInvalidReason?: string | null;
    score: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers?: number;
    unanswered?: number;
    multiMarked?: number;
    multi_marked_questions?: string[];
    unmarked_questions?: string[];
    responses?: Record<string, string>;
    imageQuality: string;
    requiresReview: boolean;
    reviewReasons?: string[];
    processingTimeMs?: number;
  };
  onDelete?: (scanId: string) => void;
  showActions?: boolean;
}

export function ScanResultCard({
  scan,
  onDelete,
  showActions = true,
}: ScanResultCardProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return "text-apple-green";
    if (percentage >= 50) return "text-apple-orange";
    return "text-apple-red";
  };

  const getQualityBadge = (quality: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      excellent: { color: "bg-apple-green/10 text-apple-green", label: "Excelente" },
      good: { color: "bg-apple-blue/10 text-apple-blue", label: "Boa" },
      fair: { color: "bg-apple-orange/10 text-apple-orange", label: "Regular" },
      poor: { color: "bg-apple-red/10 text-apple-red", label: "Ruim" },
    };
    return variants[quality] || variants.fair;
  };

  const qualityBadge = getQualityBadge(scan.imageQuality);

  // Extract studentId value (handle both string and object formats)
  const getStudentIdDisplay = () => {
    if (!scan.studentId) return "ID não detectado";
    if (typeof scan.studentId === "string") return scan.studentId;
    if (typeof scan.studentId === "object" && scan.studentId !== null) {
      return scan.studentId.value || "ID não detectado";
    }
    return "ID não detectado";
  };

  const isStudentCodeInvalid = scan.studentCodeValid === false && scan.studentCodeInvalidReason;

  return (
    <Card className={cn(scan.requiresReview && "border-apple-orange/50")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className={cn(isStudentCodeInvalid && "text-apple-orange")}>
                {getStudentIdDisplay()}
              </span>
            </CardTitle>
            {isStudentCodeInvalid && (
              <p className="text-xs text-apple-orange mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {scan.studentCodeInvalidReason}
              </p>
            )}
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3" />
              {scan.processingTimeMs
                ? `${(scan.processingTimeMs / 1000).toFixed(1)}s`
                : "—"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={qualityBadge.color}>
              <ImageIcon className="w-3 h-3 mr-1" />
              {qualityBadge.label}
            </Badge>
            {scan.requiresReview && (
              <Badge className="bg-apple-orange/10 text-apple-orange">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Revisar
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Score display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={cn("text-4xl font-bold", getScoreColor(scan.percentage))}>
              {scan.percentage.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {scan.correctAnswers} de {scan.totalQuestions} questões
            </p>
          </div>

          {/* Score breakdown */}
          <div className={cn(
            "grid gap-4 text-center",
            (scan.multiMarked ?? 0) > 0 ? "grid-cols-4" : "grid-cols-3"
          )}>
            <div>
              <div className="flex items-center justify-center text-apple-green">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="font-semibold">{scan.correctAnswers}</span>
              </div>
              <p className="text-xs text-muted-foreground">Corretas</p>
            </div>
            {scan.incorrectAnswers !== undefined && (
              <div>
                <div className="flex items-center justify-center text-apple-red">
                  <XCircle className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{scan.incorrectAnswers}</span>
                </div>
                <p className="text-xs text-muted-foreground">Erradas</p>
              </div>
            )}
            <div>
              <div className="flex items-center justify-center text-muted-foreground">
                <MinusCircle className="w-4 h-4 mr-1" />
                <span className="font-semibold">{scan.unanswered ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">Não marcadas</p>
            </div>
            {(scan.multiMarked ?? 0) > 0 && (
              <div>
                <div className="flex items-center justify-center text-apple-orange">
                  <CircleDot className="w-4 h-4 mr-1" />
                  <span className="font-semibold">{scan.multiMarked}</span>
                </div>
                <p className="text-xs text-muted-foreground">Multi-marcadas</p>
              </div>
            )}
          </div>
        </div>

        {/* Single “Atenção” block: multi-marked (with marks read) and unmarked — no redundancy */}
        {(() => {
          const total = scan.totalQuestions ?? 0;
          const inRange = (q: string) => {
            const m = String(q).match(/^q(\d+)$/i);
            if (!m) return false;
            const n = parseInt(m[1], 10);
            return n >= 1 && n <= total;
          };
          const multiInRange = (scan.multi_marked_questions ?? []).filter(inRange);
          const unmarkedInRange = (scan.unmarked_questions ?? []).filter(inRange);
          const qNum = (q: string) => {
            const m = String(q).match(/^q(\d+)$/i);
            return m ? m[1] : q;
          };
          if (multiInRange.length === 0 && unmarkedInRange.length === 0) return null;
          return (
            <div className="rounded-lg border border-apple-orange/30 bg-apple-orange/5 p-3 mb-4 space-y-3">
              <p className="text-xs font-semibold text-apple-orange flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Atenção
              </p>
              {multiInRange.length > 0 && scan.responses && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1.5">Multi-marcadas (marcas lidas)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {multiInRange.map((q) => (
                      <span
                        key={q}
                        className="inline-flex items-center rounded-md bg-apple-orange/15 px-2 py-1 text-xs font-medium text-apple-orange border border-apple-orange/30"
                      >
                        {qNum(q)}: {scan.responses[q] ?? "—"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {unmarkedInRange.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1.5">Não marcadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {unmarkedInRange.map((q) => (
                      <span
                        key={q}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        {qNum(q)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Other review reasons only (e.g. high unanswered); skip “Questões com mais de uma marca”) */}
        {(() => {
          const otherReasons =
            scan.reviewReasons?.filter(
              (r) => !/^Questões com mais de uma marca:\s*\d+$/.test(r.trim())
            ) ?? [];
          if (otherReasons.length === 0) return null;
          return (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Motivos para revisão</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {otherReasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Actions */}
        {showActions && onDelete && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(scan.scanId)}
              className="text-apple-red hover:text-apple-red hover:bg-apple-red/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
