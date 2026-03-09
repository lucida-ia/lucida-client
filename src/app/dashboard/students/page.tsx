"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Upload, UserPlus, Pencil, Trash2, Copy, Download, FileDown, Printer } from "lucide-react";
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

const TEMPLATE_CSV = "aluno,turma,email,matricula\nMaria Silva,3º Ano A,maria@escola.edu,1001\nJoão Santos,3º Ano A,joao@escola.edu,1002\nAna Costa,3º Ano B,ana@escola.edu,1003";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMatricula, setFormMatricula] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentItem | null>(null);
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
  const [printCodesStudents, setPrintCodesStudents] = useState<StudentItem[]>([]);
  const [printCodesLoading, setPrintCodesLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await axios.get("/api/class");
      if (res.data.status === "success") {
        setClasses(
          (res.data.data ?? res.data).map((c: { id?: string; _id?: string; name: string; description?: string }) => ({
            id: c.id ?? c._id,
            name: c.name,
            description: c.description,
          }))
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
      if (classFilter && classFilter !== "all") params.set("classId", classFilter);
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
          toast({ title: res.data.message ?? "Erro ao atualizar", variant: "destructive" });
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
          toast({ title: res.data.message ?? "Erro ao cadastrar", variant: "destructive" });
        }
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Erro ao salvar";
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
        toast({ title: res.data.message ?? "Erro ao excluir", variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Erro ao excluir";
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
        toast({ title: res.data.message ?? "Erro na importação", variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Erro na importação";
      toast({ title: msg ?? "Erro na importação", variant: "destructive" });
    } finally {
      setCsvSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
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
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
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
      const res = await axios.get(`/api/student?classId=${printCodesClassId}&limit=500`);
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
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const className = classes.find((c) => c.id === printCodesClassId)?.name ?? "turma";
    a.download = `codigos_${className.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV baixado" });
  };

  const handlePrintCodes = () => {
    const className = classes.find((c) => c.id === printCodesClassId)?.name ?? "Turma";
    const rows = printCodesStudents.map(
      (s) => `<tr><td>${escapeHtml(s.name)}</td><td class="code">${escapeHtml(s.code)}</td></tr>`
    ).join("");
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

  return (
    <div className="space-y-6 w-full max-w-6xl">
      {/* 1. Title + subtitle */}
      <DashboardHeader
        heading="Cadastro de Alunos"
        text="Cadastre alunos e use o código de 7 dígitos na folha de respostas para identificar as provas."
      />

      {/* 2. Import box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setCsvDragging(true);
        }}
        onDragLeave={() => setCsvDragging(false)}
        onDrop={handleCsvDrop}
        className={`rounded-apple border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 min-h-[140px] transition-colors ${csvDragging ? "border-apple-blue bg-apple-blue/5" : "border-apple-gray-4"}`}
      >
        <Upload className="h-10 w-10 text-apple-blue" />
        <p className="text-subhead font-medium">Importar CSV</p>
        <p className="text-footnote text-muted-foreground text-center max-w-xl">
          Arraste um arquivo ou use o botão abaixo. Colunas obrigatórias: aluno (ou nome), turma, matricula. Opcional: email, sala. Matrícula deve ser única.
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="tinted"
            size="sm"
            disabled={csvSubmitting}
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            {csvSubmitting ? "Enviando…" : "Selecionar arquivo"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Modelo CSV
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

      {importResult && (
        <div className="rounded-apple border border-apple-gray-4 bg-card p-4">
          <p className="text-subhead font-medium mb-2">Resultado da importação</p>
          <p className="text-footnote text-muted-foreground">
            {importResult.created} alunos criados.
            {importResult.failed > 0 && ` ${importResult.failed} falhas.`}
            {importResult.skipped > 0 && ` ${importResult.skipped} ignorados (já cadastrados).`}
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 text-footnote text-muted-foreground list-disc list-inside max-h-32 overflow-y-auto">
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
          {importResult.skippedDetails.length > 0 && importResult.skippedDetails.length <= 10 && (
            <ul className="mt-2 text-footnote text-muted-foreground list-disc list-inside max-h-24 overflow-y-auto">
              {importResult.skippedDetails.map((s, i) => (
                <li key={i}>
                  Linha {s.row}: {s.message}
                </li>
              ))}
            </ul>
          )}
          {importResult.skippedDetails.length > 10 && (
            <p className="mt-2 text-footnote text-muted-foreground">
              … e mais {importResult.skippedDetails.length - 10} linhas já cadastradas
            </p>
          )}
        </div>
      )}

      {/* 3. Filters + export + add */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px]">
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
        <Button variant="outline" size="default" onClick={exportStudentsList} disabled={students.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar lista
        </Button>
        <Button variant="outline" size="default" onClick={openPrintCodes} disabled={classes.length === 0}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir códigos
        </Button>
        <Button variant="tinted" onClick={openCreateModal} disabled={classes.length === 0}>
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar manualmente
        </Button>
      </div>

      {/* 4. Students list */}

      <div className="rounded-apple border border-apple-gray-4 bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-subhead font-medium">Nenhum aluno cadastrado</p>
            <p className="text-footnote mt-1">
              Importe um CSV ou cadastre manualmente para começar.
            </p>
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
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.className ?? s.classId}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.matricula ?? "—"}</TableCell>
                  <TableCell>
                    <span className="font-mono">{s.code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-1"
                      onClick={() => copyCode(s.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(s)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStudentToDelete(s);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-apple-red" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Editar aluno" : "Cadastrar aluno"}
            </DialogTitle>
          </DialogHeader>
          {generatedCode && (
            <div className="rounded-apple bg-apple-blue/10 text-apple-blue p-4 text-center">
              <p className="text-footnote font-medium">Código gerado</p>
              <p className="text-title-3 font-mono font-bold">{generatedCode}</p>
              <p className="text-caption-2 mt-1">Informe este código ao aluno para preencher na folha de respostas.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => copyCode(generatedCode!)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar código
              </Button>
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="student-name">Nome *</Label>
              <Input
                id="student-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do aluno"
                required
                disabled={!!generatedCode}
              />
            </div>
            {!editingStudent && (
              <div>
                <Label htmlFor="student-class">Turma *</Label>
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
            <div>
              <Label htmlFor="student-email">Email (opcional)</Label>
              <Input
                id="student-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@escola.edu"
                disabled={!!generatedCode}
              />
            </div>
            <div>
              <Label htmlFor="student-matricula">Matrícula *</Label>
              <Input
                id="student-matricula"
                value={formMatricula}
                onChange={(e) => setFormMatricula(e.target.value)}
                placeholder="Ex: 1001"
                required
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
                  {formSubmitting ? "Salvando…" : editingStudent ? "Atualizar" : "Cadastrar"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              O aluno será removido. As provas já escaneadas continuarão exibindo o código, mas sem nome. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Cancelar</AlertDialogCancel>
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

      <Dialog open={printCodesOpen} onOpenChange={setPrintCodesOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Imprimir códigos por turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
            <div>
              <Label>Turma</Label>
              <Select value={printCodesClassId} onValueChange={setPrintCodesClassId}>
                <SelectTrigger className="mt-1">
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
            <div className="border rounded-apple overflow-auto flex-1 min-h-[200px] print:overflow-visible print:min-h-0" id="print-codes-table">
              {printCodesLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando…</div>
              ) : printCodesStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum aluno nesta turma.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="font-mono">Código (7 dígitos)</TableHead>
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
            <div className="flex gap-2 pt-2 print:hidden">
              <Button variant="outline" onClick={downloadPrintCodesCsv} disabled={printCodesStudents.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button onClick={handlePrintCodes} disabled={printCodesStudents.length === 0}>
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
