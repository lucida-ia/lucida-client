"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Award,
  Users,
  Target,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  Share2,
  Trash,
  Pencil,
  Save,
  X,
  ArrowUp,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import React from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { exportExamToWord } from "@/lib/word-export";
import { exportResultsToCSV } from "@/lib/csv-export";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

// Types
interface Result {
  _id: string;
  examId: string;
  classId: string;
  email: string;
  score: number;
  percentage: number;
  examTitle: string;
  examQuestionCount: number;
  createdAt: Date;
}

interface ExamData {
  _id: string;
  title: string;
  description?: string;
  questions: any[];
  createdAt: Date;
  updatedAt: Date;
  results: Result[];
}

interface ClassData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  exams: ExamData[];
  totalResults: number;
  totalQuestions: number;
}

interface PageData {
  classes: ClassData[];
  summary: {
    classes: number;
    exams: number;
    results: number;
    questions: number;
  };
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
      
      {/* Classes Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function UnifiedOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [data, setData] = React.useState<PageData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expandedClasses, setExpandedClasses] = React.useState<Set<string>>(new Set());
  const [activeExam, setActiveExam] = React.useState<string | null>(null);
  const [showMoreResults, setShowMoreResults] = React.useState<Set<string>>(new Set());
  const [exportingExamId, setExportingExamId] = React.useState<string | null>(null);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [examToShare, setExamToShare] = React.useState<ExamData | null>(null);
  
  // Edit class state
  const [editingClass, setEditingClass] = React.useState<ClassData | null>(null);
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Create class modal state
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = React.useState(false);
  const [newClassName, setNewClassName] = React.useState("");
  const [isCreatingClass, setIsCreatingClass] = React.useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [examsResponse, resultsResponse] = await Promise.all([
        axios.get("/api/exam/all"),
        axios.get("/api/class")
      ]);
      
      const classesData = examsResponse.data.data;
      const classResults = resultsResponse.data.data;
      
      // Transform data to unified structure
      const classes: ClassData[] = [];
      let totalExams = 0;
      let totalResults = 0;
      let totalQuestions = 0;
      
      classesData.forEach((classItem: any) => {
        const classResultsData = classResults.find((cr: any) => cr.id === classItem.id);
        
        const examsWithResults: ExamData[] = classItem.exams.map((exam: any) => {
          const examResults = classResultsData?.results?.filter((result: Result) => 
            result.examId === exam._id
          ) || [];
          
          return {
            ...exam,
            results: examResults,
          };
        });

        const classData: ClassData = {
          id: classItem.id,
          name: classItem.name,
          description: classResultsData?.description || "",
          createdAt: classResultsData?.createdAt || new Date(),
          updatedAt: classResultsData?.updatedAt || new Date(),
          exams: examsWithResults,
          totalResults: examsWithResults.reduce((acc, exam) => acc + exam.results.length, 0),
          totalQuestions: examsWithResults.reduce((acc, exam) => acc + exam.questions.length, 0),
        };
        
        classes.push(classData);
        totalExams += examsWithResults.length;
        totalResults += classData.totalResults;
        totalQuestions += classData.totalQuestions;
      });
      
      setData({
        classes,
        summary: {
          classes: classes.length,
          exams: totalExams,
          results: totalResults,
          questions: totalQuestions,
        },
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar turmas e provas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
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

  // Action handlers
  const toggleClassExpansion = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const toggleExamDetail = (examId: string) => {
    setActiveExam(activeExam === examId ? null : examId);
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

  const collapseAll = () => {
    setExpandedClasses(new Set());
    setActiveExam(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditClass = (classItem: ClassData) => {
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
        fetchData();
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

  const handleDeleteClass = async (classId: string) => {
    try {
      const response = await axios.delete("/api/class", {
        data: { id: classId },
      });

      if (response.status === 200) {
        toast({
          title: "Turma deletada com sucesso",
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar turma",
        description: "Ocorreu um erro ao deletar a turma. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da turma é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingClass(true);

    try {
      const response = await axios.post("/api/class", {
        name: newClassName.trim(),
      });

      if (response.status === 200) {
        toast({
          title: "Turma criada com sucesso",
        });
        setIsCreateClassModalOpen(false);
        setNewClassName("");
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Erro ao criar turma",
        description: "Ocorreu um erro ao criar a turma. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  const openCreateClassModal = () => {
    setNewClassName("");
    setIsCreateClassModalOpen(true);
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      const response = await axios.delete("/api/exam", {
        data: { examId },
      });

      if (response.status === 200) {
        toast({
          title: "Prova deletada com sucesso",
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar prova",
        description: "Ocorreu um erro ao deletar a prova. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExportWord = async (exam: ExamData) => {
    try {
      setExportingExamId(exam._id);
      await exportExamToWord({ ...exam, description: exam.description || "" }, false);
      toast({
        title: "Documento Word exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar documento",
        description: "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingExamId(null);
    }
  };

  const handleExportClassResults = (classItem: ClassData) => {
    try {
      const allResults = classItem.exams.flatMap(exam => exam.results);
      
      if (allResults.length === 0) {
        toast({
          title: "Nenhum resultado para exportar",
          description: "Esta turma não possui resultados de provas para exportar.",
          variant: "destructive",
        });
        return;
      }

      exportResultsToCSV(allResults, `${classItem.name}_todos_resultados`);
      toast({
        title: "CSV exportado com sucesso!",
        description: "Os resultados foram salvos no seu dispositivo.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar CSV",
        description: "Ocorreu um erro ao gerar o arquivo CSV. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExportExamResults = (exam: ExamData) => {
    try {
      if (exam.results.length === 0) {
        toast({
          title: "Nenhum resultado para exportar",
          description: "Esta prova não possui resultados para exportar.",
          variant: "destructive",
        });
        return;
      }

      const sanitizedTitle = exam.title.replace(/[^a-zA-Z0-9\s]/g, "_");
      exportResultsToCSV(exam.results, `${sanitizedTitle}_resultados`);
      toast({
        title: "CSV exportado com sucesso!",
        description: `Os resultados da prova "${exam.title}" foram salvos no seu dispositivo.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar CSV",
        description: "Ocorreu um erro ao gerar o arquivo CSV. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleShareExam = (exam: ExamData) => {
    setExamToShare(exam);
    setShareModalOpen(true);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Minhas Avaliações"
            text="Visão unificada de todas as suas turmas e provas"
          />
        </div>
        <div className="mt-4">
          <PageSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Minhas Avaliações"
          text="Visão unificada de todas as suas turmas e provas"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openCreateClassModal}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Nova Turma
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/exams/create")}>
              <FileText className="h-4 w-4 mr-2" />
              Nova Avaliação
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-6 mt-4">
        {data && data.classes.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Total de Turmas
                    </p>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {data.summary.classes}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Turmas criadas
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                <CardContent className="flex items-start justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Total de Provas
                    </p>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {data.summary.exams}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Provas criadas
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                      {data.summary.results}
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
                      Total de Questões
                    </p>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {data.summary.questions}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Questões criadas
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Classes List */}
            <div className="space-y-4">
              {data.classes.map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                  <CardHeader>
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
                              expandedClasses.has(classItem.id) ? "rotate-90" : "rotate-0"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </Button>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="flex items-center gap-2 font-medium text-base">
                              <BookOpen className="h-5 w-5" />
                              {classItem.name}
                            </h3>

                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
                              {classItem.exams.length} provas
                            </Badge>
                            <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs">
                              {classItem.totalResults} resultados
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleClassExpansion(classItem.id)}
                          className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200"
                        >
                          <div
                            className={`transform transition-transform duration-200 ${
                              expandedClasses.has(classItem.id) ? "rotate-90" : "rotate-0"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </Button>
                        <div>
                          <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
                            <BookOpen className="h-5 w-5" />
                            {classItem.name}
                          </CardTitle>

                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          {classItem.exams.length} provas
                        </Badge>
                        <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                          {classItem.totalResults} resultados
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedClasses.has(classItem.id) && (
                    <CardContent>
                      {/* Class Actions */}
                      <div className="mb-6 pb-4 border-b">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                          <h4 className="font-medium text-gray-700 dark:text-zinc-300">
                            Ações da Turma
                          </h4>
                        </div>
                        
                        {/* Mobile Actions */}
                        <div className="block md:hidden space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportClassResults(classItem)}
                            disabled={classItem.totalResults === 0}
                            className="w-full flex items-center justify-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                          >
                            <Download className="h-3 w-3" />
                            Exportar Todos
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClass(classItem)}
                              className="flex items-center justify-center gap-2"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center justify-center gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteClass(classItem.id)}
                            >
                              <Trash className="h-3 w-3" />
                              Deletar
                            </Button>
                          </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportClassResults(classItem)}
                            disabled={classItem.totalResults === 0}
                            className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                          >
                            <Download className="h-3 w-3" />
                            Exportar Todos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClass(classItem)}
                            className="gap-2"
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

                      {/* Exam Grid */}
                      {classItem.exams.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                            <h4 className="font-medium text-gray-700 dark:text-zinc-300">
                              Provas da Turma ({classItem.exams.length})
                            </h4>
                          </div>
                          
                          <div className="space-y-4">
                            {classItem.exams.map((exam, index) => (
                              <div key={exam._id}>
                                {/* Exam Card */}
                                <Card
                                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    activeExam === exam._id
                                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                                      : "hover:border-gray-300 dark:hover:border-zinc-600"
                                  }`}
                                  onClick={() => toggleExamDetail(exam._id)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-medium text-sm text-gray-900 dark:text-zinc-100 truncate">
                                            {exam.title}
                                          </h5>
                                          <div
                                            className={`transform transition-transform duration-200 ${
                                              activeExam === exam._id ? "rotate-90" : "rotate-0"
                                            }`}
                                          >
                                            <ChevronRight className="h-3 w-3 text-gray-500" />
                                          </div>
                                        </div>
                                        {exam.description && (
                                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                            {exam.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-zinc-400">
                                          <span>{exam.questions.length} questões</span>
                                          <span>•</span>
                                          <span>
                                            {formatDistanceToNow(exam.createdAt, {
                                              addSuffix: true,
                                              locale: ptBR,
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        {exam.results.length}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Inline Exam Detail Panel */}
                                {activeExam === exam._id && (
                                  <Card className="mt-2 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                                    <CardContent className="p-4">
                                      {/* Exam Header */}
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-base text-gray-900 dark:text-zinc-100">
                                            {exam.title}
                                          </h5>
                                          {exam.description && (
                                            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                                              {exam.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-zinc-400">
                                            <span>{exam.questions.length} questões</span>
                                            <span>•</span>
                                            <span>{exam.results.length} resultado(s)</span>
                                            <span>•</span>
                                            <span>Criada {formatDistanceToNow(exam.createdAt, { addSuffix: true, locale: ptBR })}</span>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveExam(null);
                                          }}
                                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      {/* Exam Actions */}
                                      <div className="mb-4 pb-4 border-b border-blue-200 dark:border-blue-700">
                                        {/* Mobile Actions */}
                                        <div className="block md:hidden space-y-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                              className="flex items-center justify-center gap-2"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Link href={`/dashboard/exams/${exam._id}`}>
                                                <Eye className="h-3 w-3" />
                                                Ver
                                              </Link>
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportWord(exam);
                                              }}
                                              disabled={exportingExamId === exam._id}
                                              className="flex items-center justify-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                                            >
                                              <Download className="h-3 w-3" />
                                              {exportingExamId === exam._id ? "..." : "Word"}
                                            </Button>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="flex items-center justify-center gap-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleShareExam(exam);
                                              }}
                                            >
                                              <Share2 className="h-3 w-3" />
                                              Compartilhar
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="flex items-center justify-center gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteExam(exam._id);
                                              }}
                                            >
                                              <Trash className="h-3 w-3" />
                                              Deletar
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Desktop Actions */}
                                        <div className="hidden md:flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="flex items-center gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Link href={`/dashboard/exams/${exam._id}`}>
                                              <Eye className="h-3 w-3" />
                                              Ver Prova
                                            </Link>
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExportWord(exam);
                                            }}
                                            disabled={exportingExamId === exam._id}
                                            className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                                          >
                                            <Download className="h-3 w-3" />
                                            {exportingExamId === exam._id ? "Gerando..." : "Word"}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleShareExam(exam);
                                            }}
                                          >
                                            <Share2 className="h-3 w-3" />
                                            Compartilhar
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteExam(exam._id);
                                            }}
                                          >
                                            <Trash className="h-3 w-3" />
                                            Deletar
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Results */}
                                      {(() => {
                                        const showMore = showMoreResults.has(exam._id);
                                        const maxResults = 5;
                                        const displayedResults = showMore ? exam.results : exam.results.slice(0, maxResults);
                                        const hasMoreResults = exam.results.length > maxResults;

                                        return exam.results.length > 0 ? (
                                          <div>
                                            <div className="flex items-center justify-between mb-3">
                                              <h6 className="font-medium text-sm text-gray-800 dark:text-zinc-200">
                                                Resultados ({exam.results.length})
                                              </h6>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleExportExamResults(exam);
                                                }}
                                                className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                                              >
                                                <Download className="h-3 w-3" />
                                                <span className="hidden sm:inline">Exportar CSV</span>
                                                <span className="sm:hidden">CSV</span>
                                              </Button>
                                            </div>
                                            <div className="space-y-2">
                                              {displayedResults.map((result) => (
                                                <div
                                                  key={result._id}
                                                  className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800/50 rounded-lg border border-blue-200 dark:border-blue-700"
                                                >
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-sm text-gray-900 dark:text-zinc-100 truncate">
                                                      {result.email}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                      {formatDate(result.createdAt)}
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-4">
                                                    <span className="text-sm font-medium">
                                                      {result.score}/{result.examQuestionCount}
                                                    </span>
                                                    <span className={`text-sm font-bold ${getPercentageColor(result.percentage)}`}>
                                                      {(result.percentage * 100).toFixed(1)}%
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                            
                                            {hasMoreResults && (
                                              <div className="mt-3 text-center">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleShowMoreResults(exam._id);
                                                  }}
                                                  className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50"
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
                                        ) : (
                                          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4 bg-white dark:bg-zinc-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                            Ainda não há resultados para esta prova
                                          </p>
                                        );
                                      })()}
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-zinc-400 text-sm">
                            Esta turma ainda não possui provas
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <BookOpen className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-50 mb-2">
                    Nenhuma turma encontrada
                  </h3>
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">
                    Comece criando sua primeira turma para organizar suas provas.
                  </p>
                  <Button onClick={openCreateClassModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Turma
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      {expandedClasses.size > 0 && (
        <Button
          onClick={collapseAll}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      )}

      {/* Create Class Modal */}
      <Dialog open={isCreateClassModalOpen} onOpenChange={setIsCreateClassModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Criar Nova Turma
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-class-name">Nome da Turma</Label>
              <Input
                id="new-class-name"
                placeholder="Digite o nome da turma"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                disabled={isCreatingClass}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreatingClass && newClassName.trim()) {
                    handleCreateClass();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsCreateClassModalOpen(false)}
              disabled={isCreatingClass}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleCreateClass}
              disabled={isCreatingClass || !newClassName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreatingClass ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Criar Turma
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              onClick={() => setIsEditDialogOpen(false)}
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

      {/* Share Exam Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhar Prova
            </DialogTitle>
          </DialogHeader>
          {examToShare && (
            <ShareExamContent 
              exam={examToShare} 
              onClose={() => setShareModalOpen(false)}
              toast={toast}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Share Exam Content Component
interface ShareExamContentProps {
  exam: ExamData;
  onClose: () => void;
  toast: any;
}

function ShareExamContent({ exam, onClose, toast }: ShareExamContentProps) {
  const [config, setConfig] = React.useState({
    allowConsultation: false,
    showScoreAtEnd: true,
    showCorrectAnswersAtEnd: false,
  });
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleConfigChange = (key: string, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const encodeConfig = (config: any): string => {
    const configString = JSON.stringify(config);
    return btoa(configString);
  };

  const shareOrCopyLink = async (shareUrl: string): Promise<{ success: boolean; method: string }> => {
    // Try Web Share API first (works great on Safari mobile)
    if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: exam.title,
          text: 'Acesse esta prova:',
          url: shareUrl,
        });
        return { success: true, method: 'share' };
      } catch (err) {
        // User cancelled share or API failed
        console.warn('Web Share API failed:', err);
      }
    }

    // Try clipboard API with immediate execution (preserves user gesture)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, method: 'clipboard' };
      } catch (err) {
        console.warn('Modern clipboard API failed:', err);
      }
    }

    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return { success: true, method: 'execCommand' };
      }
    } catch (err) {
      console.error('Fallback clipboard failed:', err);
    }

    return { success: false, method: 'none' };
  };

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);
      
      // Generate the share URL first
      const response = await axios.post("/api/exam/share", { examId: exam._id });
      const encodedConfig = encodeConfig(config);
      const shareUrl = `${window.location.origin}/exam/${response.data.id}?c=${encodedConfig}`;

      // Try to share or copy immediately (preserves user gesture)
      const result = await shareOrCopyLink(shareUrl);

      if (result.success) {
        if (result.method === 'share') {
          toast({
            title: "Prova Compartilhada!",
            description: "O link da prova foi compartilhado com sucesso.",
          });
        } else {
          toast({
            title: "Link da Prova Copiado!",
            description: "O link da prova foi copiado com as configurações de segurança aplicadas.",
          });
        }
        onClose();
      } else {
        // Fallback: show the URL so user can copy manually
        toast({
          title: "Link da Prova Gerado!",
          description: `Link: ${shareUrl}`,
          duration: 15000, // Show longer so user can copy
        });
        onClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao gerar link de compartilhamento",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-zinc-100">
          {exam.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Configure as opções de segurança antes de compartilhar esta prova.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Permitir consulta durante a prova</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Alunos podem acessar materiais de apoio durante a realização
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowConsultation}
              onChange={(e) => handleConfigChange('allowConsultation', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Mostrar pontuação ao final</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Exibir a nota final para o aluno após completar a prova
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.showScoreAtEnd}
              onChange={(e) => handleConfigChange('showScoreAtEnd', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Mostrar respostas corretas ao final</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Revelar as respostas corretas após a conclusão da prova
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCorrectAnswersAtEnd}
              onChange={(e) => handleConfigChange('showCorrectAnswersAtEnd', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isGenerating}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleGenerateLink}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Gerando Link...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Gerar Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}