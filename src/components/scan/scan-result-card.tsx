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
  Eye,
  Trash2,
  User,
  Clock,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanResultCardProps {
  scan: {
    scanId: string;
    studentId: string | null | { value: string | null; isValid?: boolean };
    score: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers?: number;
    unanswered?: number;
    imageQuality: string;
    requiresReview: boolean;
    reviewReasons?: string[];
    processingTimeMs?: number;
  };
  onView?: (scanId: string) => void;
  onDelete?: (scanId: string) => void;
  showActions?: boolean;
}

export function ScanResultCard({
  scan,
  onView,
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

  return (
    <Card className={cn(scan.requiresReview && "border-apple-orange/50")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              {getStudentIdDisplay()}
            </CardTitle>
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
          <div className="grid grid-cols-3 gap-4 text-center">
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
            {scan.unanswered !== undefined && (
              <div>
                <div className="flex items-center justify-center text-muted-foreground">
                  <span className="font-semibold">{scan.unanswered}</span>
                </div>
                <p className="text-xs text-muted-foreground">Em branco</p>
              </div>
            )}
          </div>
        </div>

        {/* Review reasons */}
        {scan.requiresReview && scan.reviewReasons && scan.reviewReasons.length > 0 && (
          <div className="bg-apple-orange/5 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-apple-orange mb-1">
              Motivos para revisão:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {scan.reviewReasons.map((reason, index) => (
                <li key={index}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(scan.scanId)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(scan.scanId)}
                className="text-apple-red hover:text-apple-red hover:bg-apple-red/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
