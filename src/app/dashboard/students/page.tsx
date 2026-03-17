"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Upload,
  UserPlus,
  Pencil,
  Trash2,
  Copy,
  Download,
  FileDown,
  Printer,
  Search,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClassItem {
  id: string;
  name: string;
  description?: string;
}

interface StudentItem {
  _id: string;
  code: string;
  name: string;
  classId: string;
  className: string | null;
  email: string | null;
  matricula: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_CSV =
  "aluno,turma,email,matricula\nMaria Silva,3º Ano A,maria@escola.edu,1001\nJoão Santos,3º Ano A,joao@escola.edu,1002\nAna Costa,3º Ano B,ana@escola.edu,1003";

export default function StudentsPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(
    null,
  );
  const [formName, setFormName] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMatricula, setFormMatricula] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvSubmitting, setCsvSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    failed: number;
    skipped: number;
    errors: { row: number; message: string }[];
    skippedDetails: { row: number; message: string }[];
  } | null>(null);
  const [printCodesOpen, setPrintCodesOpen] = useState(false);
  const [printCodesClassId, setPrintCodesClassId] = useState<string>("");
  const [printCodesStudents, setPrintCodesStudents] = useState<StudentItem[]>(
    [],
  );
  const [printCodesLoading, setPrintCodesLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get("/api/class");
      if (res.data.status === "success") {
        setClasses(
          (res.data.data ?? res.data).map(
            (c: {
              id?: string;
              _id?: string;
              name: string;
              description?: string;
            }) => ({
              id: c.id ?? c._id,
              name: c.name,
              description: c.description,
            }),
          ),
        );
      }
    } catch (e) {
      console.error("Failed to fetch classes", e);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classFilter && classFilter !== "all")
        params.set("classId", classFilter);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      const res = await axios.get(`/api/student?${params}`);
      if (res.data.status === "success") {
        setStudents(res.data.data.students ?? []);
        setPagination((prev) => ({
          ...prev,
          ...res.data.data.pagination,
        }));
      }
    } catch (e) {
      console.error("Failed to fetch students", e);
      toast({ title: "Erro ao carregar alunos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [classFilter, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.matricula ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.className ?? "").toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormName("");
    setFormClassId(classes[0]?.id ?? "");
    setFormEmail("");
    setFormMatricula("");
    setGeneratedCode(null);
    setModalOpen(true);
  };

  const openEditModal = (s: StudentItem) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormClassId(s.classId);
    setFormEmail(s.email ?? "");
    setFormMatricula(s.matricula ?? "");
    setGeneratedCode(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (!formMatricula.trim()) {
      toast({ title: "Matrícula é obrigatória", variant: "destructive" });
      return;
    }
    const targetClassId = editingStudent ? editingStudent.classId : formClassId;
    if (!targetClassId) {
      toast({ title: "Selecione uma turma", variant: "destructive" });
      return;
    }
    setFormSubmitting(true);
    try {
      if (editingStudent) {
        const res = await axios.put(`/api/student/${editingStudent._id}`, {
          name: formName.trim(),
          email: formEmail.trim() || null,
          matricula: formMatricula.trim() || null,
        });
        if (res.data.status === "success") {
          toast({ title: "Aluno atualizado com sucesso" });
          setModalOpen(false);
          fetchStudents();
        } else {
          toast({
            title: res.data.message ?? "Erro ao atualizar",
            variant: "destructive",
          });
        }
      } else {
        const res = await axios.post("/api/student", {
          name: formName.trim(),
          classId: targetClassId,
          email: formEmail.trim() || null,
          matricula: formMatricula.trim() || null,
        });
        if (res.data.status === "success") {
          const code = res.data.data?.code;
          setGeneratedCode(code ?? null);
          toast({
            title: "Aluno cadastrado",
            description: code ? `Código: ${code}` : undefined,
          });
          fetchStudents();
          if (code) {
            setFormName("");
            setFormEmail("");
            setFormMatricula("");
            setFormClassId(classes[0]?.id ?? "");
          } else {
            setModalOpen(false);
          }
        } else {
          toast({
            title: res.data.message ?? "Erro ao cadastrar",
            variant: "destructive",
          });
        }
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Erro ao salvar";
      toast({ title: msg ?? "Erro ao salvar", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setDeleteSubmitting(true);
    try {
      const res = await axios.delete(`/api/student/${studentToDelete._id}`);
      if (res.data.status === "success") {
        toast({ title: "Aluno excluído" });
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
        fetchStudents();
      } else {
        toast({
          title: res.data.message ?? "Erro ao excluir",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Erro ao excluir";
      toast({ title: msg ?? "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado" });
  };

  const handleCsvDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCsvDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      uploadCsvFile(file);
    } else {
      toast({ title: "Envie um arquivo CSV", variant: "destructive" });
    }
  };

  const handleCsvFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadCsvFile(file);
    e.target.value = "";
  };

  const uploadCsvFile = async (file: File) => {
    setCsvSubmitting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/student/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status === "success") {
        const d = res.data.data;
        setImportResult({
          created: d.created ?? 0,
          failed: d.failed ?? 0,
          skipped: d.skipped ?? 0,
          errors: d.errors ?? [],
          skippedDetails: d.skippedDetails ?? [],
        });
        const parts = [`${d.created ?? 0} criados`];
        if ((d.failed ?? 0) > 0) parts.push(`${d.failed} falhas`);
        if ((d.skipped ?? 0) > 0) parts.push(`${d.skipped} já cadastrados`);
        toast({
          title: "Importação concluída",
          description: parts.join(", "),
        });
        await fetchClasses();
        fetchStudents();
      } else {
        toast({
          title: res.data.message ?? "Erro na importação",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Erro na importação";
      toast({ title: msg ?? "Erro na importação", variant: "destructive" });
    } finally {
      setCsvSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_alunos.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Modelo baixado" });
  };

  const exportStudentsList = () => {
    const headers = ["Nome", "Turma", "Matrícula", "Código", "Email"];
    const rows = students.map((s) => [
      s.name,
      s.className ?? s.classId,
      s.matricula ?? "",
      s.code,
      s.email ?? "",
    ]);
    const escape = (v: string) =>
      /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
        "\n",
      );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alunos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Lista exportada" });
  };

  const openPrintCodes = () => {
    setPrintCodesOpen(true);
    setPrintCodesClassId(classes[0]?.id ?? "");
    setPrintCodesStudents([]);
  };

  const loadPrintCodesStudents = useCallback(async () => {
    if (!printCodesClassId) {
      setPrintCodesStudents([]);
      return;
    }
    setPrintCodesLoading(true);
    try {
      const res = await axios.get(
        `/api/student?classId=${printCodesClassId}&limit=500`,
      );
      if (res.data.status === "success") {
        setPrintCodesStudents(res.data.data.students ?? []);
      }
    } catch {
      setPrintCodesStudents([]);
    } finally {
      setPrintCodesLoading(false);
    }
  }, [printCodesClassId]);

  useEffect(() => {
    if (printCodesOpen && printCodesClassId) loadPrintCodesStudents();
  }, [printCodesOpen, printCodesClassId, loadPrintCodesStudents]);

  const downloadPrintCodesCsv = () => {
    const headers = ["Nome", "Código"];
    const rows = printCodesStudents.map((s) => [s.name, s.code]);
    const escape = (v: string) =>
      /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
        "\n",
      );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const className =
      classes.find((c) => c.id === printCodesClassId)?.name ?? "turma";
    a.download = `codigos_${className.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV baixado" });
  };

  const handlePrintCodes = () => {
    const className =
      classes.find((c) => c.id === printCodesClassId)?.name ?? "Turma";
    const rows = printCodesStudents
      .map(
        (s) =>
          `<tr><td>${escapeHtml(s.name)}</td><td class="code">${escapeHtml(s.code)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Códigos - ${escapeHtml(className)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    th { font-weight: 600; }
    td.code { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Códigos de alunos – ${escapeHtml(className)}</h1>
  <table>
    <thead><tr><th>Nome</th><th>Código (7 dígitos)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Permita pop-ups para imprimir", variant: "destructive" });
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  const uniqueClassCount = new Set(students.map((s) => s.classId)).size;

  return (
    <div className="space-y-6 w-full">
      <DashboardHeader
        heading="Cadastro de Alunos"
        text="Cadastre alunos e use o código de 7 dígitos na folha de respostas para identificar as provas."
      />

      {/* Stats summary */}
      {!loading && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="apple-shadow">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-footnote text-muted-foreground font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-title-2 font-bold text-foreground">
                {pagination.total}
              </p>
            </CardContent>
          </Card>
          <Card className="apple-shadow">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-footnote text-muted-foreground font-medium flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-title-2 font-bold text-foreground">
                {classes.length}
              </p>
            </CardContent>
          </Card>
          <Card className="apple-shadow col-span-2 sm:col-span-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-footnote text-muted-foreground font-medium flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Turmas com alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-title-2 font-bold text-foreground">
                {uniqueClassCount}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CSV Import */}
      <Card className="apple-shadow max-w-4xl mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-headline font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-apple-blue" />
            Importar via CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setCsvDragging(true);
            }}
            onDragLeave={() => setCsvDragging(false)}
            onDrop={handleCsvDrop}
            className={`rounded-apple border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 min-h-[120px] apple-transition ${
              csvDragging
                ? "border-apple-blue bg-apple-blue/5"
                : "border-apple-gray-4 hover:border-apple-gray-3"
            }`}
          >
            <Upload className="h-8 w-8 text-apple-blue" />
            <p className="text-subhead font-medium">
              Arraste o arquivo CSV aqui
            </p>
            <p className="text-footnote text-muted-foreground text-center max-w-xl">
              Colunas obrigatórias:{" "}
              <span className="font-mono bg-muted px-1 rounded text-xs">
                aluno
              </span>
              ,{" "}
              <span className="font-mono bg-muted px-1 rounded text-xs">
                turma
              </span>
              ,{" "}
              <span className="font-mono bg-muted px-1 rounded text-xs">
                matricula
              </span>
              . Opcional:{" "}
              <span className="font-mono bg-muted px-1 rounded text-xs">
                email
              </span>
              . A matrícula deve ser única.
            </p>
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              <Button
                variant="tinted"
                size="sm"
                disabled={csvSubmitting}
                onClick={() => document.getElementById("csv-upload")?.click()}
              >
                {csvSubmitting ? "Enviando…" : "Selecionar arquivo"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-1.5" />
                Baixar modelo
              </Button>
            </div>
            <input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvFileInput}
              disabled={csvSubmitting}
            />
          </div>

          {/* Import result */}
          {importResult && (
            <div
              className={`rounded-apple border p-4 space-y-2 ${
                importResult.failed > 0
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                  : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {importResult.failed > 0 ? (
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                )}
                <p className="text-subhead font-medium">
                  Resultado da importação
                </p>
                <div className="flex gap-1.5 ml-auto flex-wrap justify-end">
                  {importResult.created > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-footnote"
                    >
                      {importResult.created} criados
                    </Badge>
                  )}
                  {importResult.skipped > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-apple-gray-5 text-muted-foreground text-footnote"
                    >
                      {importResult.skipped} ignorados
                    </Badge>
                  )}
                  {importResult.failed > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-footnote"
                    >
                      {importResult.failed} falhas
                    </Badge>
                  )}
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="text-footnote text-muted-foreground list-disc list-inside max-h-32 overflow-y-auto space-y-0.5">
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      Linha {err.row}: {err.message}
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>… e mais {importResult.errors.length - 10} erros</li>
                  )}
                </ul>
              )}
              {importResult.skippedDetails.length > 0 &&
                importResult.skippedDetails.length <= 10 && (
                  <ul className="text-footnote text-muted-foreground list-disc list-inside max-h-24 overflow-y-auto space-y-0.5">
                    {importResult.skippedDetails.map((s, i) => (
                      <li key={i}>
                        Linha {s.row}: {s.message}
                      </li>
                    ))}
                  </ul>
                )}
              {importResult.skippedDetails.length > 10 && (
                <p className="text-footnote text-muted-foreground">
                  … e mais {importResult.skippedDetails.length - 10} linhas já
                  cadastradas
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters + actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar por nome, matrícula, código…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-body placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="default"
            onClick={exportStudentsList}
            disabled={students.length === 0}
            title="Exportar lista em CSV"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={openPrintCodes}
            disabled={classes.length === 0}
            title="Imprimir códigos por turma"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="tinted"
            onClick={openCreateModal}
            disabled={classes.length === 0}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo aluno
          </Button>
        </div>
      </div>

      {/* Students table */}
      <Card>
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-apple-gray-5 flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-subhead font-medium text-foreground">
                {searchQuery || classFilter !== "all"
                  ? "Nenhum aluno encontrado"
                  : "Nenhum aluno cadastrado"}
              </p>
              <p className="text-footnote text-muted-foreground mt-1">
                {searchQuery || classFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Importe um CSV ou cadastre manualmente para começar."}
              </p>
            </div>
            {!searchQuery && classFilter === "all" && classes.length > 0 && (
              <Button
                variant="tinted"
                size="sm"
                onClick={openCreateModal}
                className="mt-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar primeiro aluno
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow
                    key={s._id}
                    className="hover:bg-apple-gray-6/50 apple-transition"
                  >
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light text-footnote border border-apple-blue/20 dark:border-apple-blue/30 font-normal"
                      >
                        {s.className ?? s.classId}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {s.matricula ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm">{s.code}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground apple-transition"
                          onClick={() => copyCode(s.code)}
                          title="Copiar código"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {s.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 apple-transition"
                          onClick={() => openEditModal(s)}
                          title="Editar aluno"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 apple-transition text-apple-red hover:text-apple-red hover:bg-apple-red/10"
                          onClick={() => {
                            setStudentToDelete(s);
                            setDeleteDialogOpen(true);
                          }}
                          title="Excluir aluno"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-apple-gray-5">
            <p className="text-footnote text-muted-foreground">
              {pagination.total} alunos no total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    page: Math.max(1, p.page - 1),
                  }))
                }
              >
                Anterior
              </Button>
              <span className="text-footnote text-muted-foreground px-1">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    page: Math.min(p.totalPages, p.page + 1),
                  }))
                }
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingStudent ? "Editar aluno" : "Cadastrar aluno"}
            </DialogTitle>
          </DialogHeader>

          {generatedCode && (
            <div className="rounded-apple bg-apple-blue/10 text-apple-blue p-4 text-center border border-apple-blue/20">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-apple-blue" />
              <p className="text-footnote font-medium mb-1">
                Aluno cadastrado com sucesso
              </p>
              <p className="text-title-3 font-mono font-bold tracking-widest">
                {generatedCode}
              </p>
              <p className="text-caption-2 mt-1 text-apple-blue/80">
                Informe este código ao aluno para preencher na folha de
                respostas.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-apple-blue/30 text-apple-blue hover:bg-apple-blue/10"
                onClick={() => copyCode(generatedCode!)}
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Copiar código
              </Button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="student-name">
                Nome <span className="text-apple-red">*</span>
              </Label>
              <Input
                id="student-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome completo do aluno"
                required
                disabled={!!generatedCode}
                autoFocus={!generatedCode}
              />
            </div>
            {!editingStudent && (
              <div className="space-y-1.5">
                <Label htmlFor="student-class">
                  Turma <span className="text-apple-red">*</span>
                </Label>
                <Select
                  value={formClassId}
                  onValueChange={setFormClassId}
                  disabled={!!generatedCode}
                >
                  <SelectTrigger id="student-class">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="student-matricula">
                Matrícula <span className="text-apple-red">*</span>
              </Label>
              <Input
                id="student-matricula"
                value={formMatricula}
                onChange={(e) => setFormMatricula(e.target.value)}
                placeholder="Ex: 1001"
                required
                disabled={!!generatedCode}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-email">
                Email{" "}
                <span className="text-muted-foreground text-footnote font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="student-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@escola.edu"
                disabled={!!generatedCode}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                {generatedCode ? "Fechar" : "Cancelar"}
              </Button>
              {!generatedCode && (
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting
                    ? "Salvando…"
                    : editingStudent
                      ? "Atualizar"
                      : "Cadastrar"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{studentToDelete?.name}</strong> será removido. As provas
              já escaneadas continuarão exibindo o código, mas sem nome
              associado. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSubmitting}
              className="bg-apple-red text-white hover:bg-apple-red/90"
            >
              {deleteSubmitting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print codes modal */}
      <Dialog open={printCodesOpen} onOpenChange={setPrintCodesOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Imprimir códigos por turma
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="space-y-1.5">
              <Label>Selecione a turma</Label>
              <Select
                value={printCodesClassId}
                onValueChange={setPrintCodesClassId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="border border-apple-gray-4 rounded-apple overflow-auto flex-1 min-h-[200px]"
              id="print-codes-table"
            >
              {printCodesLoading ? (
                <div className="p-8 text-center text-muted-foreground text-footnote">
                  Carregando…
                </div>
              ) : printCodesStudents.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Info className="h-5 w-5" />
                  <p className="text-footnote">Nenhum aluno nesta turma.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código (7 dígitos)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printCodesStudents.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="font-mono">{s.code}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="flex gap-2 pt-1 print:hidden">
              <Button
                variant="outline"
                onClick={downloadPrintCodesCsv}
                disabled={printCodesStudents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button
                onClick={handlePrintCodes}
                disabled={printCodesStudents.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
