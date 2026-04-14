"use client";

import React from "react";
import Link from "next/link";
import axios from "axios";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  ScanLine,
  Share2,
  Trash,
  BarChart3,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { exportExamToWord } from "@/lib/word-export";
import { exportResultsToCSV } from "@/lib/csv-export";
import {
  fetchUnifiedOverviewData,
  type ClassData,
  type ExamData,
} from "@/lib/fetch-unified-overview-data";
import { ShareExamContent } from "@/components/dashboard/share-exam-content";
import { getImpersonateUserId } from "@/lib/utils";
import { isTrialUserPastOneWeek } from "@/lib/utils";
import { ExpiredTrialAlert } from "@/components/ui/expired-trial-alert";

interface ClassMeta {
  id: string;
  name: string;
  description: string;
  examCount: number;
  studentCount: number;
  lastExamAt: string | null;
  lastExamTitle: string | null;
}

interface StudentRow {
  _id: string;
  code: string;
  name: string;
  matricula: string | null;
}

export function TurmaHubClient({ classId }: { classId: string }) {
  const { toast } = useToast();
  const [meta, setMeta] = React.useState<ClassMeta | null>(null);
  const [classItem, setClassItem] = React.useState<ClassData | null>(null);
  const [userData, setUserData] = React.useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [exportingExamId, setExportingExamId] = React.useState<string | null>(
    null
  );

  const [copyExam, setCopyExam] = React.useState<ExamData | null>(null);
  const [copyOpen, setCopyOpen] = React.useState(false);
  const [selectedTargetClassId, setSelectedTargetClassId] = React.useState("");
  const [isCreatingNewClass, setIsCreatingNewClass] = React.useState(false);
  const [newClassNameForCopy, setNewClassNameForCopy] = React.useState("");
  const [isCopyingExam, setIsCopyingExam] = React.useState(false);

  const allClasses = React.useMemo(() => {
    const u = userData as { classes?: { _id: string; name: string }[] } | null;
    return u?.classes ?? [];
  }, [userData]);

  const shouldDisableActions = userData?.user
    ? isTrialUserPastOneWeek(userData.user as Parameters<typeof isTrialUserPastOneWeek>[0])
    : false;

  const loadCore = React.useCallback(async () => {
    try {
      setLoading(true);
      const asUser = getImpersonateUserId();
      const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
      const [metaRes, overview] = await Promise.all([
        axios.get(`/api/class/${classId}${qs}`),
        fetchUnifiedOverviewData(),
      ]);

      if (metaRes.data.status !== "success") {
        setNotFound(true);
        return;
      }
      setMeta(metaRes.data.data);
      setUserData(overview.userData as Record<string, unknown>);

      const found = overview.classes.find(
        (c) => String(c.id) === String(classId)
      );
      if (!found) {
        setNotFound(true);
        return;
      }
      setClassItem(found);
      setNotFound(false);
    } catch {
      setNotFound(true);
      toast({ title: "Erro ao carregar turma", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [classId, toast]);

  const loadStudents = React.useCallback(async () => {
    try {
      setStudentsLoading(true);
      const res = await axios.get(
        `/api/student?classId=${encodeURIComponent(classId)}&limit=100&page=1`
      );
      if (res.data.status === "success") {
        setStudents(res.data.data.students ?? []);
      }
    } catch {
      toast({ title: "Erro ao carregar alunos", variant: "destructive" });
    } finally {
      setStudentsLoading(false);
    }
  }, [classId, toast]);

  React.useEffect(() => {
    loadCore();
  }, [loadCore]);

  React.useEffect(() => {
    if (classItem) loadStudents();
  }, [classItem, loadStudents]);

  const refresh = () => {
    loadCore();
    loadStudents();
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      const response = await axios.delete("/api/exam", {
        data: { examId },
      });
      if (response.status === 200) {
        toast({ title: "Prova deletada com sucesso" });
        refresh();
      }
    } catch {
      toast({
        title: "Erro ao deletar prova",
        variant: "destructive",
      });
    }
  };

  const handleExportWord = async (exam: ExamData) => {
    try {
      setExportingExamId(exam._id);
      await exportExamToWord(
        { ...exam, description: exam.description || "" },
        false
      );
      toast({
        title: "Documento Word exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch {
      toast({ title: "Erro ao exportar Word", variant: "destructive" });
    } finally {
      setExportingExamId(null);
    }
  };

  const handleExportExamResults = (exam: ExamData) => {
    try {
      if (exam.results.length === 0) {
        toast({
          title: "Nenhum resultado para exportar",
          variant: "destructive",
        });
        return;
      }
      const sanitizedTitle = exam.title.replace(/[^a-zA-Z0-9\s]/g, "_");
      exportResultsToCSV(exam.results, `${sanitizedTitle}_resultados`);
      toast({ title: "CSV exportado com sucesso!" });
    } catch {
      toast({ title: "Erro ao exportar CSV", variant: "destructive" });
    }
  };

  const openCopy = (exam: ExamData) => {
    setCopyExam(exam);
    setSelectedTargetClassId("");
    setIsCreatingNewClass(false);
    setNewClassNameForCopy("");
    setCopyOpen(true);
  };

  const handleCopyExamToClass = async () => {
    if (!copyExam) return;
    if (isCreatingNewClass) {
      if (!newClassNameForCopy.trim()) {
        toast({
          title: "Nome da turma obrigatório",
          variant: "destructive",
        });
        return;
      }
      try {
        setIsCopyingExam(true);
        const asUser = getImpersonateUserId();
        const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
        const classResponse = await axios.post("/api/class" + qs, {
          name: newClassNameForCopy.trim(),
          description: "",
        });
        if (classResponse.data.status !== "success") {
          throw new Error(classResponse.data.message);
        }
        const newClassId = classResponse.data.data._id;
        const payload = {
          config: {
            title: copyExam.title,
            description: copyExam.description || "",
            questionStyle: "simple" as const,
            questionCount: copyExam.questions.length,
            class: {
              _id: newClassId,
              name: newClassNameForCopy.trim(),
            },
            questionTypes: {
              multipleChoice: true,
              trueFalse: true,
              shortAnswer: false,
              essay: false,
            },
            difficulty: "médio",
            timeLimit: 60,
          },
          questions: copyExam.questions,
        };
        const examResponse = await axios.post("/api/exam/copy" + qs, payload);
        if (examResponse.data.status === "success") {
          toast({ title: "Turma criada e prova copiada!" });
          setCopyOpen(false);
          setCopyExam(null);
          refresh();
        }
      } catch (e: unknown) {
        toast({
          title: "Erro ao copiar",
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        });
      } finally {
        setIsCopyingExam(false);
      }
      return;
    }

    if (!selectedTargetClassId) return;
    const targetClass = allClasses.find((c) => c._id === selectedTargetClassId);
    if (!targetClass) {
      toast({ title: "Turma de destino não encontrada", variant: "destructive" });
      return;
    }

    try {
      setIsCopyingExam(true);
      const asUser = getImpersonateUserId();
      const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
      const payload = {
        config: {
          title: copyExam.title,
          description: copyExam.description || "",
          questionStyle: "simple" as const,
          questionCount: copyExam.questions.length,
          class: {
            _id: selectedTargetClassId,
            name: targetClass.name,
          },
          questionTypes: {
            multipleChoice: true,
            trueFalse: true,
            shortAnswer: false,
            essay: false,
          },
          difficulty: "médio",
          timeLimit: 60,
        },
        questions: copyExam.questions,
      };
      const examResponse = await axios.post("/api/exam/copy" + qs, payload);
      if (examResponse.data.status === "success") {
        toast({ title: "Prova copiada com sucesso" });
        setCopyOpen(false);
        setCopyExam(null);
        refresh();
      }
    } catch {
      toast({ title: "Erro ao copiar prova", variant: "destructive" });
    } finally {
      setIsCopyingExam(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !meta || !classItem) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/dashboard/turmas">
            <ArrowLeft className="h-4 w-4" />
            Voltar às turmas
          </Link>
        </Button>
        <p className="text-muted-foreground">Turma não encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/turmas" className="hover:text-foreground">
            Turmas
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{meta.name}</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <DashboardHeader
            heading={meta.name}
            text={
              meta.description ||
              "Provas e alunos desta turma. Use as abas para alternar."
            }
          />
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" asChild size="sm">
              <Link href={`/dashboard/students?classId=${classId}`}>
                <Pencil className="h-4 w-4 mr-1" />
                Gerir alunos
              </Link>
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              asChild
            >
              <Link
                href={`/dashboard/exams/create?classId=${encodeURIComponent(classId)}`}
              >
                <FileText className="h-4 w-4 mr-1" />
                Nova prova
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {shouldDisableActions && <ExpiredTrialAlert />}

      <Tabs defaultValue="provas" className="mt-6">
        <TabsList>
          <TabsTrigger value="provas">Provas</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
        </TabsList>

        <TabsContent value="provas" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>
              {classItem.exams.length}{" "}
              {classItem.exams.length === 1 ? "prova" : "provas"} ·{" "}
              {meta.studentCount}{" "}
              {meta.studentCount === 1 ? "aluno" : "alunos"}
            </span>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href={`/dashboard/analytics/turmas/${classId}`}>
                <BarChart3 className="h-4 w-4 mr-1" />
                Análises desta turma
              </Link>
            </Button>
          </div>

          {classItem.exams.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhuma prova nesta turma ainda.
                <div className="mt-4">
                  <Button asChild>
                    <Link
                      href={`/dashboard/exams/create?classId=${encodeURIComponent(classId)}`}
                    >
                      Criar primeira prova
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {classItem.exams.map((exam) => (
                <Card key={exam._id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{exam.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">
                          {exam.questions.length} questões
                        </Badge>
                        <Badge variant="secondary">
                          {exam.results.length} resultados
                        </Badge>
                        <span>
                          {formatDistanceToNow(new Date(exam.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={shouldDisableActions}>
                          Ações
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/exams/${exam._id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver prova
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/analytics/turmas/${classId}/provas/${exam._id}`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/scan?examId=${encodeURIComponent(exam._id)}`}
                          >
                            <ScanLine className="h-4 w-4 mr-2" />
                            Scanner
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportWord(exam)}
                          disabled={
                            exportingExamId === exam._id || shouldDisableActions
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {exportingExamId === exam._id ? "Gerando..." : "Word"}
                        </DropdownMenuItem>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              disabled={shouldDisableActions}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Gerar link
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Compartilhar prova</DialogTitle>
                            </DialogHeader>
                            <ShareExamContent exam={exam} toast={toast} />
                          </DialogContent>
                        </Dialog>
                        <DropdownMenuItem
                          onClick={() => handleExportExamResults(exam)}
                          disabled={
                            shouldDisableActions || exam.results.length === 0
                          }
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCopy(exam)} disabled={shouldDisableActions}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteExam(exam._id)}
                          disabled={shouldDisableActions}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alunos" className="mt-4 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {studentsLoading
                ? "Carregando..."
                : `${students.length} alunos (até 100 nesta lista)`}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/students?classId=${encodeURIComponent(classId)}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Gestão completa
              </Link>
            </Button>
          </div>
          {studentsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum aluno nesta turma.
                <div className="mt-4">
                  <Button asChild>
                    <Link href={`/dashboard/students?classId=${encodeURIComponent(classId)}`}>
                      Cadastrar alunos
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Matrícula</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.code}</TableCell>
                      <TableCell>{s.matricula ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar prova</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Turma de destino</Label>
              <Select
                value={selectedTargetClassId}
                onValueChange={(v) => {
                  setSelectedTargetClassId(v);
                  setIsCreatingNewClass(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {allClasses
                    .filter((c) => c._id !== classId)
                    .map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new-class-copy"
                checked={isCreatingNewClass}
                onChange={(e) => {
                  setIsCreatingNewClass(e.target.checked);
                  if (e.target.checked) setSelectedTargetClassId("");
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="new-class-copy">Criar nova turma</Label>
            </div>
            {isCreatingNewClass && (
              <div className="space-y-2">
                <Label>Nome da nova turma</Label>
                <Input
                  value={newClassNameForCopy}
                  onChange={(e) => setNewClassNameForCopy(e.target.value)}
                  placeholder="Nome"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={isCopyingExam}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={handleCopyExamToClass}
                disabled={
                  isCopyingExam ||
                  (!isCreatingNewClass && !selectedTargetClassId) ||
                  (isCreatingNewClass && !newClassNameForCopy.trim())
                }
              >
                {isCopyingExam ? "Copiando..." : "Duplicar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
