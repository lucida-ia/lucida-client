"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  History,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScanSummary {
  scanId: string;
  examId: string;
  examTitle: string;
  studentId: string | null;
  score: number;
  percentage: number;
  totalQuestions: number;
  scannedAt: string;
  imageQuality: string;
  requiresReview: boolean;
  reviewReasons: string[];
  reviewStatus: string;
}

interface Exam {
  _id: string;
  title: string;
}

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [showReviewOnly, setShowReviewOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch exams for filter
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch("/api/exam/all");
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          // Flatten exams from all classes
          const flatExams: Exam[] = [];
          data.data.forEach((cls: any) => {
            if (Array.isArray(cls.exams)) {
              cls.exams.forEach((exam: any) => {
                flatExams.push({ _id: exam._id, title: exam.title });
              });
            }
          });
          setExams(flatExams);
        }
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      }
    };
    fetchExams();
  }, []);

  // Fetch scans
  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (selectedExam !== "all") {
        params.append("examId", selectedExam);
      }

      if (showReviewOnly) {
        params.append("requiresReview", "true");
      }

      const response = await fetch(`/api/scan?${params}`);
      const data = await response.json();

      if (data.status === "success") {
        setScans(data.scans);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch scans:", error);
      toast.error("Erro ao carregar digitalizações");
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, showReviewOnly]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Delete scan
  const handleDelete = async (scanId: string) => {
    try {
      const response = await fetch(`/api/scan/${scanId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Digitalização deletada");
        fetchScans();
      } else {
        toast.error("Erro ao deletar digitalização");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao deletar digitalização");
    }
  };

  // Get quality badge color
  const getQualityBadge = (quality: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      excellent: { color: "bg-apple-green/10 text-apple-green", label: "Excelente" },
      good: { color: "bg-apple-blue/10 text-apple-blue", label: "Boa" },
      fair: { color: "bg-apple-orange/10 text-apple-orange", label: "Regular" },
      poor: { color: "bg-apple-red/10 text-apple-red", label: "Ruim" },
    };
    return variants[quality] || variants.fair;
  };

  // Get status badge
  const getStatusBadge = (scan: ScanSummary) => {
    if (scan.requiresReview) {
      return (
        <Badge className="bg-apple-orange/10 text-apple-orange">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Revisar
        </Badge>
      );
    }
    if (scan.reviewStatus === "approved" || scan.reviewStatus === "corrected") {
      return (
        <Badge className="bg-apple-green/10 text-apple-green">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprovado
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted text-muted-foreground">
        Pendente
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Histórico de Digitalizações
          </h1>
          <p className="text-muted-foreground">
            {total} digitalização{total !== 1 ? "ões" : ""} encontrada{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchScans} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/dashboard/scan">Novo Scan</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <Select value={selectedExam} onValueChange={(v) => { setSelectedExam(v); setPage(1); }}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Todas as provas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as provas</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam._id} value={exam._id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showReviewOnly ? "default" : "outline"}
              size="sm"
              onClick={() => { setShowReviewOnly(!showReviewOnly); setPage(1); }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Apenas para revisão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scans Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma digitalização encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {selectedExam !== "all" || showReviewOnly
                  ? "Tente ajustar os filtros"
                  : "Comece digitalizando folhas de respostas"}
              </p>
              <Button asChild>
                <Link href="/dashboard/scan">Iniciar Scanner</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Prova</TableHead>
                  <TableHead className="text-center">Nota</TableHead>
                  <TableHead className="text-center">Qualidade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => {
                  const qualityBadge = getQualityBadge(scan.imageQuality);
                  return (
                    <TableRow key={scan.scanId}>
                      <TableCell className="font-medium">
                        {scan.studentId || (
                          <span className="text-muted-foreground italic">
                            Não detectado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-1">{scan.examTitle}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "font-semibold",
                            scan.percentage >= 70
                              ? "text-apple-green"
                              : scan.percentage >= 50
                              ? "text-apple-orange"
                              : "text-apple-red"
                          )}
                        >
                          {scan.percentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({scan.score}/{scan.totalQuestions})
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={qualityBadge.color}>
                          {qualityBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(scan)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(scan.scannedAt), "dd/MM/yy HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/dashboard/scan/${scan.scanId}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-apple-red hover:text-apple-red hover:bg-apple-red/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deletar digitalização?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A digitalização será permanentemente removida.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(scan.scanId)}
                                  className="bg-apple-red hover:bg-apple-red/90"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
