"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  Award,
  ChevronDown,
  ChevronRight,
  Download,
  Pencil,
  Trash,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  Save,
  Eye,
} from "lucide-react";
import React from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { exportResultsToCSV } from "@/lib/csv-export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Class = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  studants: Student[];
  results: Result[];
};

type Student = {
  _id: string;
  name: string;
  email: string;
};

type Result = {
  _id: string;
  examId: string;
  classId: string;
  email: string;
  score: number;
  examTitle: string;
  examQuestionCount: number;
  percentage: number;
  createdAt: Date;
};

function ClassesSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg px-6 py-4 shadow-sm bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClassesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedExams, setSelectedExams] = React.useState<
    Record<string, string>
  >({});
  const [expandedClasses, setExpandedClasses] = React.useState<Set<string>>(new Set());
  const [expandedExams, setExpandedExams] = React.useState<Set<string>>(new Set());
  const [showMoreResults, setShowMoreResults] = React.useState<Set<string>>(new Set());
  const [editingClass, setEditingClass] = React.useState<Class | null>(null);
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/class");
      setClasses(response.data.data);
    } catch (error) {
      toast({
        title: "Erro ao carregar turmas",
        description: "Não foi possível carregar as turmas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const response = await axios.delete("/api/class", {
        data: { id },
      });

      if (response.status === 200) {
        toast({
          title: "Turma deletada com sucesso",
        });
        fetchClasses();
      } else {
        toast({
          title: "Erro ao deletar turma",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar turma",
        description: "Ocorreu um erro ao deletar a turma. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setEditFormData({
      name: classItem.name,
      description: classItem.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    if (!editFormData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da turma é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await axios.put("/api/class", {
        id: editingClass.id,
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
      });

      if (response.status === 200) {
        toast({
          title: "Turma atualizada com sucesso",
        });
        setIsEditDialogOpen(false);
        setEditingClass(null);
        setEditFormData({ name: "", description: "" });
        fetchClasses();
      } else {
        toast({
          title: "Erro ao atualizar turma",
          description: response.data.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar turma",
        description: "Ocorreu um erro ao atualizar a turma. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingClass(null);
    setEditFormData({ name: "", description: "" });
  };

  const handleExportCSV = (classItem: Class, selectedExam: string) => {
    try {
      const resultsToExport =
        selectedExam === "all" || !selectedExam
          ? classItem.results
          : classItem.results.filter(
              (result) => result.examId === selectedExam
            );

      if (resultsToExport.length === 0) {
        toast({
          title: "Nenhum resultado para exportar",
          description:
            "Esta turma não possui resultados de provas para exportar.",
          variant: "destructive",
        });
        return;
      }

      const examTitle =
        selectedExam === "all" || !selectedExam
          ? "todos_os_resultados"
          : resultsToExport[0]?.examTitle || "resultados";

      const filename = `${classItem.name}_${examTitle}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      exportResultsToCSV(resultsToExport, filename);

      toast({
        title: "CSV exportado com sucesso!",
        description: "Os resultados foram salvos no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Erro ao exportar CSV",
        description: "Ocorreu um erro ao gerar o arquivo CSV. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const toggleClassExpansion = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const toggleExamExpansion = (examId: string) => {
    const newExpanded = new Set(expandedExams);
    if (newExpanded.has(examId)) {
      newExpanded.delete(examId);
    } else {
      newExpanded.add(examId);
    }
    setExpandedExams(newExpanded);
  };

  const toggleShowMoreResults = (examId: string) => {
    const newShowMore = new Set(showMoreResults);
    if (newShowMore.has(examId)) {
      newShowMore.delete(examId);
    } else {
      newShowMore.add(examId);
    }
    setShowMoreResults(newShowMore);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getUniqueExams = (results: Result[]) => {
    const examMap = new Map();
    results.forEach(result => {
      if (!examMap.has(result.examId)) {
        examMap.set(result.examId, {
          id: result.examId,
          title: result.examTitle,
          questionCount: result.examQuestionCount,
          results: []
        });
      }
      examMap.get(result.examId).results.push(result);
    });
    return Array.from(examMap.values());
  };

  // Calculate summary statistics
  const totalResults = classes.reduce((acc, cls) => acc + (cls.results?.length || 0), 0);
  const totalExams = classes.reduce((acc, cls) => {
    const uniqueExams = getUniqueExams(cls.results || []);
    return acc + uniqueExams.length;
  }, 0);

  React.useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Minhas Turmas"
          text="Gerencie suas turmas e acompanhe o desempenho dos alunos"
        />
        <Button onClick={() => router.push("/dashboard/classes/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Turma
        </Button>
      </div>

      <div className="space-y-6 mt-4">
        {isLoading ? (
          <ClassesSkeleton />
        ) : classes?.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Total de Turmas
                    </p>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {classes.length}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Turmas criadas
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Total de Resultados
                    </p>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {totalResults}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Provas realizadas
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Total de Provas
                    </p>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {totalExams}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Provas criadas
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Classes List */}
            <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 py-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
                  <BookOpen className="h-5 w-5" />
                  Suas Turmas ({classes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.map((classItem) => {
                    const uniqueExams = getUniqueExams(classItem.results || []);
                    const isExpanded = expandedClasses.has(classItem.id);

                    return (
                      <div
                        key={classItem.id}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        {/* Main Class Row */}
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-all duration-200">
                          {/* Mobile Layout */}
                          <div className="block md:hidden">
                            <div className="flex items-start gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleClassExpansion(classItem.id)}
                                className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200 mt-1"
                              >
                                <div
                                  className={`transform transition-transform duration-200 ${
                                    isExpanded ? "rotate-90" : "rotate-0"
                                  }`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </Button>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h4 className="font-medium text-base">
                                    {classItem.name}
                                  </h4>
                                  {classItem.description && (
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                      {classItem.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 dark:text-zinc-400 text-sm">
                                    Resultados:
                                  </span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    {classItem.results?.length || 0}
                                  </span>
                                </div>


                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-10">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleClassExpansion(classItem.id)}
                                  className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200"
                                >
                                  <div
                                    className={`transform transition-transform duration-200 ${
                                      isExpanded ? "rotate-90" : "rotate-0"
                                    }`}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </div>
                                </Button>
                                <div>
                                  <p className="font-medium">
                                    {classItem.name}
                                  </p>
                                  {classItem.description && (
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                      {classItem.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                {classItem.results?.length || 0} resultados
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-zinc-900/50 border-t">
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                                <h4 className="font-medium text-gray-700 dark:text-zinc-300">
                                  Ações da Turma
                                </h4>
                              </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                                  size="sm"
                        onClick={() =>
                                    handleExportCSV(classItem, "all")
                        }
                        disabled={
                          !classItem.results || classItem.results.length === 0
                        }
                                  className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                      >
                                  <Download className="h-3 w-3" />
                                  Exportar
                      </Button>
                                                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => handleEditClass(classItem)}
                                >
                                  <Pencil className="h-3 w-3" />
                                  Editar
                      </Button>
                      <Button
                        variant="outline"
                                  size="sm"
                                  className="gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleDeleteClass(classItem.id)}
                      >
                                  <Trash className="h-3 w-3" />
                                  Deletar
                      </Button>
                    </div>
                  </div>

                                                        {/* Exams Overview */}
                            {uniqueExams.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                  <BookOpen className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                                  <h4 className="font-medium text-gray-700 dark:text-zinc-300">
                                    Provas da Turma ({uniqueExams.length})
                                  </h4>
                                </div>
                                
                                {uniqueExams.map((exam) => {
                                  const isExamExpanded = expandedExams.has(exam.id);
                                  const showMore = showMoreResults.has(exam.id);
                                  const maxResults = 3;
                                  const displayedResults = showMore ? exam.results : exam.results.slice(0, maxResults);
                                  const hasMoreResults = exam.results.length > maxResults;
                                  
                                  return (
                                    <div key={exam.id} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-800/30">
                                      {/* Exam Header */}
                                      <div className="p-3 bg-white dark:bg-zinc-800/50 border-b">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleExamExpansion(exam.id)}
                                              className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-zinc-700"
                                            >
                                              <div
                                                className={`transform transition-transform duration-200 ${
                                                  isExamExpanded ? "rotate-90" : "rotate-0"
                                                }`}
                                              >
                                                <ChevronRight className="h-3 w-3" />
                                              </div>
                                            </Button>
                                            <div>
                                              <h5 className="font-medium text-sm text-gray-900 dark:text-zinc-100">
                                                {exam.title}
                                              </h5>
                                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                {exam.questionCount} questões • {exam.results.length} resultado(s)
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportCSV(classItem, exam.id)}
                                            className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20 h-7 text-xs"
                                          >
                                            <Download className="h-3 w-3" />
                                            Exportar
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Exam Results */}
                                      {isExamExpanded && exam.results.length > 0 && (
                                        <div className="p-3">
                                          {/* Desktop Results Table */}
                                          <div className="hidden md:block">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="text-xs">Email</TableHead>
                                                  <TableHead className="text-center text-xs">Pontuação</TableHead>
                                                  <TableHead className="text-center text-xs">Percentual</TableHead>
                                                  <TableHead className="text-xs">Data</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {displayedResults.map((result: Result) => (
                                                  <TableRow
                                                    key={result._id}
                                                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/30"
                                                  >
                                                    <TableCell className="font-mono text-xs py-2">
                                                      {result.email}
                                                    </TableCell>
                                                    <TableCell className="text-center text-xs py-2">
                                                      {result.score}/{result.examQuestionCount}
                                                    </TableCell>
                                                    <TableCell className="text-center text-xs py-2">
                                                      <span className={`font-bold ${getPercentageColor(result.percentage)}`}>
                                                        {(result.percentage * 100).toFixed(1)}%
                                                      </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-600 dark:text-zinc-400 py-2">
                                                      {formatDate(result.createdAt)}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>

                                          {/* Mobile Results Layout */}
                                          <div className="md:hidden space-y-2">
                                            {displayedResults.map((result: Result) => (
                                              <div
                                                key={result._id}
                                                className="bg-white dark:bg-zinc-800 rounded p-2 border text-sm"
                                              >
                                                <div className="font-mono text-xs text-gray-600 dark:text-zinc-400 mb-1">
                                                  {result.email}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="text-xs">
                                                    {result.score}/{result.examQuestionCount}
                                                  </span>
                                                  <span className={`font-bold text-xs ${getPercentageColor(result.percentage)}`}>
                                                    {(result.percentage * 100).toFixed(1)}%
                                                  </span>
                                                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                                                    {formatDate(result.createdAt)}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>

                                          {/* Show More Button */}
                                          {hasMoreResults && (
                                            <div className="mt-3 text-center">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleShowMoreResults(exam.id)}
                                                className="text-xs text-blue-600 dark:text-blue-400"
                                              >
                                                {showMore ? (
                                                  <>Mostrar menos ({exam.results.length - maxResults} ocultos)</>
                                                ) : (
                                                  <>Mostrar mais {exam.results.length - maxResults} resultado(s)</>
                                                )}
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Empty State for Exam */}
                                      {isExamExpanded && exam.results.length === 0 && (
                                        <div className="p-4 text-center">
                                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            Nenhum resultado para esta prova
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                  Ainda não existem resultados de provas nesta turma
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <GraduationCap className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-50 mb-2">
                Nenhuma turma encontrada
              </h3>
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">
                    Você ainda não criou nenhuma turma. Comece criando sua primeira turma.
              </p>
              <Button onClick={() => router.push("/dashboard/classes/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Turma
              </Button>
            </div>
          </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Turma
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Nome da Turma</Label>
              <Input
                id="class-name"
                placeholder="Digite o nome da turma"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-description">Descrição (opcional)</Label>
              <Input
                id="class-description"
                placeholder="Digite uma descrição para a turma"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                disabled={isUpdating}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateClass}
              disabled={isUpdating || !editFormData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
