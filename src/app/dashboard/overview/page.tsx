"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StudentAnswersDialog } from "@/components/dashboard/student-answers-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  FileSpreadsheet,
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
  Copy,
  Search,
} from "lucide-react";
import React from "react";
import axios from "axios";
import { getImpersonateUserId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { exportExamToWord } from "@/lib/word-export";
import { exportResultsToCSV } from "@/lib/csv-export";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import { isTrialUserPastOneWeek } from "@/lib/utils";
import { ExpiredTrialAlert } from "@/components/ui/expired-trial-alert";

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
  duration: number;
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
      {/* Search and Stats Skeleton */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search Skeleton */}
        <div className="relative flex-1 max-w-md">
          <Skeleton className="h-11 w-full rounded-apple" />
        </div>

        {/* Stats Skeleton */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-apple" />
            <div>
              <Skeleton className="h-6 w-8 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-apple" />
            <div>
              <Skeleton className="h-6 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
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
  const [userData, setUserData] = React.useState<any>(null);
  const [expandedClasses, setExpandedClasses] = React.useState<Set<string>>(
    new Set()
  );
  const [activeExam, setActiveExam] = React.useState<string | null>(null);
  const [showMoreResults, setShowMoreResults] = React.useState<Set<string>>(
    new Set()
  );
  const [exportingExamId, setExportingExamId] = React.useState<string | null>(
    null
  );

  // Edit class state
  const [editingClass, setEditingClass] = React.useState<ClassData | null>(
    null
  );
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Create class modal state
  const [newClassName, setNewClassName] = React.useState("");
  const [isCreatingClass, setIsCreatingClass] = React.useState(false);

  // Copy exam modal state
  const [isCopyDialogOpen, setIsCopyDialogOpen] = React.useState(false);
  const [exam, setExamToCopy] = React.useState<ExamData | null>(null);
  const [selectedTargetClassId, setSelectedTargetClassId] = React.useState("");
  const [isCopyingExam, setIsCopyingExam] = React.useState(false);
  const [isCreatingNewClass, setIsCreatingNewClass] = React.useState(false);
  const [newClassNameForCopy, setNewClassNameForCopy] = React.useState("");

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Student answers dialog state
  const [isStudentAnswersDialogOpen, setIsStudentAnswersDialogOpen] = React.useState(false);
  const [selectedResultId, setSelectedResultId] = React.useState<string | null>(null);

  // Check if trial user is past one week and should have actions disabled
  const shouldDisableActions = userData?.user
    ? isTrialUserPastOneWeek(userData.user)
    : false;

  // Filter classes and exams based on search query
  const filteredData = React.useMemo(() => {
    if (!data || !searchQuery.trim()) return data;

    const filtered = data.classes
      .map((classItem) => {
        // Check if class name matches
        const classMatches = classItem.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        // Filter exams within this class
        const filteredExams = classItem.exams.filter((exam) =>
          exam.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Include class if it matches or has matching exams
        if (classMatches || filteredExams.length > 0) {
          return {
            ...classItem,
            exams: classMatches ? classItem.exams : filteredExams,
          };
        }
        return null;
      })
      .filter(Boolean) as ClassData[];

    return {
      ...data,
      classes: filtered,
    };
  }, [data, searchQuery]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const asUser = getImpersonateUserId();
      const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";
      const [examsResponse, resultsResponse, userResponse] = await Promise.all([
        axios.get("/api/exam/all" + qs),
        axios.get("/api/class" + qs),
        axios.get("/api/user" + qs),
      ]);

      const classesData = examsResponse.data.data;
      const classResults = resultsResponse.data.data;

      // Set user data
      setUserData(userResponse.data.data);

      // Transform data to unified structure
      const classes: ClassData[] = [];
      let totalExams = 0;
      let totalResults = 0;
      let totalQuestions = 0;

      classesData.forEach((classItem: any) => {
        const classResultsData = classResults.find(
          (cr: any) => cr.id === classItem.id
        );

        const examsWithResults: ExamData[] = classItem.exams.map(
          (exam: any) => {
            const examResults =
              classResultsData?.results?.filter(
                (result: Result) => result.examId === exam._id
              ) || [];

            return {
              ...exam,
              results: examResults,
            };
          }
        );

        const classData: ClassData = {
          id: classItem.id,
          name: classItem.name,
          description: classResultsData?.description || "",
          createdAt: classResultsData?.createdAt || new Date(),
          updatedAt: classResultsData?.updatedAt || new Date(),
          exams: examsWithResults,
          totalResults: examsWithResults.reduce(
            (acc, exam) => acc + exam.results.length,
            0
          ),
          totalQuestions: examsWithResults.reduce(
            (acc, exam) => acc + exam.questions.length,
            0
          ),
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
        description:
          "Não foi possível carregar turmas e provas. Tente novamente.",
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleViewStudentAnswers = (resultId: string) => {
    setSelectedResultId(resultId);
    setIsStudentAnswersDialogOpen(true);
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
      await exportExamToWord(
        { ...exam, description: exam.description || "" },
        false
      );
      toast({
        title: "Documento Word exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar documento",
        description:
          "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingExamId(null);
    }
  };

  const handleExportClassResults = (classItem: ClassData) => {
    try {
      const allResults = classItem.exams.flatMap((exam) => exam.results);

      if (allResults.length === 0) {
        toast({
          title: "Nenhum resultado para exportar",
          description:
            "Esta turma não possui resultados de provas para exportar.",
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

  const handleCopyExam = (exam: ExamData) => {
    setExamToCopy(exam);
    setSelectedTargetClassId("");
    setIsCreatingNewClass(false);
    setNewClassNameForCopy("");
    setIsCopyDialogOpen(true);
  };

  const handleCopyExamToClass = async (exam: ExamData) => {
    // If creating a new class, handle that first
    if (isCreatingNewClass) {
      if (!newClassNameForCopy.trim()) {
        toast({
          title: "Nome da turma obrigatório",
          description: "Por favor, digite um nome para a nova turma.",
          variant: "destructive",
        });
        return;
      }
      await handleCreateClassAndCopy();
      return;
    }

    // Otherwise, proceed with existing class
    if (!selectedTargetClassId) return;

    try {
      setIsCopyingExam(true);

      const asUser = getImpersonateUserId();
      const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";

      // Find the target class name
      const targetClass = data?.classes.find(
        (c) => c.id === selectedTargetClassId
      );
      if (!targetClass) {
        throw new Error("Turma de destino não encontrada");
      }

      // Create payload in the expected format
      const payload = {
        config: {
          title: `${exam.title}`,
          description: exam.description || "",
          questionStyle: "simple" as const,
          questionCount: exam.questions.length,
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
        questions: exam.questions,
      };

      const response = await axios.post("/api/exam/copy" + qs, payload);

      if (response.data.status === "success") {
        toast({
          title: "Prova copiada com sucesso!",
          description: `A prova "${exam.title}" foi copiada para a turma "${targetClass.name}". Esta ação não afeta seus limites de uso.`,
        });

        // Close dialog and refresh data
        setIsCopyDialogOpen(false);
        setExamToCopy(null);
        setSelectedTargetClassId("");
        fetchData();
      } else {
        throw new Error(response.data.message || "Erro ao copiar prova");
      }
    } catch (error: any) {
      console.error("Error copying exam:", error);
      toast({
        title: "Erro ao copiar prova",
        description:
          error.response?.data?.message ||
          "Não foi possível copiar a prova. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCopyingExam(false);
    }
  };

  const handleCreateClassAndCopy = async () => {
    if (!exam || !newClassNameForCopy.trim()) return;

    try {
      setIsCopyingExam(true);

      const asUser = getImpersonateUserId();
      const qs = asUser ? `?asUser=${encodeURIComponent(asUser)}` : "";

      // First, create the new class
      const classResponse = await axios.post("/api/class" + qs, {
        name: newClassNameForCopy.trim(),
        description: "",
      });

      if (classResponse.data.status !== "success") {
        throw new Error(classResponse.data.message || "Erro ao criar turma");
      }

      const newClassId = classResponse.data.data._id;

      // Then copy the exam to the new class
      const payload = {
        config: {
          title: `${exam.title}`,
          description: exam.description || "",
          questionStyle: "simple" as const,
          questionCount: exam.questions.length,
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
        questions: exam.questions,
      };

      const examResponse = await axios.post("/api/exam/copy" + qs, payload);

      if (examResponse.data.status === "success") {
        toast({
          title: "Turma criada e prova copiada!",
          description: `A turma "${newClassNameForCopy.trim()}" foi criada e a prova "${
            exam.title
          }" foi copiada para ela. Esta ação não afeta seus limites de uso.`,
        });

        // Close dialog and refresh data
        setIsCopyDialogOpen(false);
        setExamToCopy(null);
        setSelectedTargetClassId("");
        setIsCreatingNewClass(false);
        setNewClassNameForCopy("");
        fetchData();
      } else {
        throw new Error(examResponse.data.message || "Erro ao copiar prova");
      }
    } catch (error: any) {
      console.error("Error creating class and copying exam:", error);
      toast({
        title: "Erro ao criar turma e copiar prova",
        description:
          error.response?.data?.message ||
          "Não foi possível criar a turma e copiar a prova. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCopyingExam(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex items-center justify-between gap-4">
        <DashboardHeader
          heading="Minhas Avaliações"
          text="Visão unificada de todas as suas turmas e provas"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={shouldDisableActions}>
              Criar
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  disabled={shouldDisableActions}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Nova Turma
                </DropdownMenuItem>
              </DialogTrigger>
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
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isCreatingClass}>
                      Cancelar
                    </Button>
                  </DialogClose>
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
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Turma
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/exams/create")}
              disabled={shouldDisableActions}
            >
              <FileText className="h-4 w-4 mr-2" />
              Nova Avaliação
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Warning banner for trial users past one week */}
      {shouldDisableActions && <ExpiredTrialAlert />}

      <div className="space-y-6 mt-4">
        {data && data.classes.length > 0 ? (
          <>
            {/* Search and Stats Section */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Search Filter */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Buscar por turma ou prova..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 text-body placeholder:text-muted-foreground bg-apple-secondary-system-background border-apple-gray-4 hover:border-apple-gray-3 focus:border-apple-blue focus:apple-focus"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Classes List */}
            {filteredData && filteredData.classes.length > 0 ? (
              filteredData.classes.map((classItem: any) => (
                <Card
                  key={classItem.id}
                  className="hover:apple-shadow apple-transition cursor-pointer"
                  onClick={() => toggleClassExpansion(classItem.id)}
                >
                  <CardHeader className="p-4">
                    {/* Mobile Layout */}
                    <div className="block md:hidden">
                      <div className="flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClassExpansion(classItem.id);
                          }}
                          className="p-2 h-auto hover:bg-apple-gray-5/50 apple-transition mt-1 rounded-apple"
                        >
                          <div
                            className={`transform transition-transform duration-200 ${
                              expandedClasses.has(classItem.id)
                                ? "rotate-90"
                                : "rotate-0"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </Button>
                        <div className="flex-1 space-y-1">
                          <div>
                            <h3 className="font-semibold text-headline text-foreground text-center">
                              {classItem.name}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light text-footnote hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition border border-apple-blue/20 dark:border-apple-blue/30"
                              >
                                {classItem.exams.length} provas
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light text-footnote hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition border border-apple-blue/20 dark:border-apple-blue/30"
                              >
                                {classItem.totalResults} resultados
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-px bg-border"></div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="tinted"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportClassResults(classItem);
                                  }}
                                  disabled={
                                    classItem.totalResults === 0 ||
                                    shouldDisableActions
                                  }
                                  title="Exportar resultados"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="tinted"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClass(classItem);
                                  }}
                                  disabled={shouldDisableActions}
                                  title="Editar turma"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClass(classItem.id);
                                  }}
                                  disabled={shouldDisableActions}
                                  className="hover:bg-apple-red/90"
                                  title="Deletar turma"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClassExpansion(classItem.id);
                          }}
                          className="p-2 h-auto hover:bg-apple-gray-5/50 apple-transition rounded-apple"
                        >
                          <div
                            className={`transform transition-transform duration-200 ${
                              expandedClasses.has(classItem.id)
                                ? "rotate-90"
                                : "rotate-0"
                            }`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </Button>
                        <div>
                          <CardTitle className="text-headline font-semibold text-foreground text-center">
                            {classItem.name}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition border border-apple-blue/20 dark:border-apple-blue/30"
                          >
                            {classItem.exams.length} provas
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition border border-apple-blue/20 dark:border-apple-blue/30"
                          >
                            {classItem.totalResults} resultados
                          </Badge>
                        </div>
                        <div className="h-4 w-px bg-border"></div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="tinted"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportClassResults(classItem);
                            }}
                            disabled={
                              classItem.totalResults === 0 ||
                              shouldDisableActions
                            }
                            title="Exportar resultados"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="tinted"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClass(classItem);
                            }}
                            disabled={shouldDisableActions}
                            title="Editar turma"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(classItem.id);
                            }}
                            disabled={shouldDisableActions}
                            className="hover:bg-apple-red/90"
                            title="Deletar turma"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedClasses.has(classItem.id) && (
                    <CardContent className="p-6 pt-0">
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
                            {classItem.exams.map((exam: any, index: number) => (
                              <Card
                                key={exam._id}
                                className="hover:apple-shadow apple-transition"
                              >
                                <CardContent className="p-3">
                                  {/* Mobile Layout */}
                                  <div className="block md:hidden">
                                    <div
                                      className="cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExamDetail(exam._id);
                                      }}
                                    >
                                      <div className="flex items-start gap-3 mb-2">
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          className="h-6 w-6 p-0 hover:bg-apple-gray-5/50 rounded-apple mt-1 flex-shrink-0"
                                        >
                                          <div
                                            className={`transform apple-transition ${
                                              activeExam === exam._id
                                                ? "rotate-90"
                                                : "rotate-0"
                                            }`}
                                          >
                                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                          </div>
                                        </Button>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-body text-foreground mb-1">
                                            {exam.title}
                                          </h5>
                                          {exam.description && (
                                            <p className="text-subhead text-muted-foreground mb-2 line-clamp-2">
                                              {exam.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Mobile Badges */}
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <Badge
                                          variant="secondary"
                                          className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light border-apple-blue/20 dark:border-apple-blue/30 hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition"
                                        >
                                          {exam.questions.length} questões
                                        </Badge>
                                        <Badge
                                          variant="secondary"
                                          className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light border-apple-blue/20 dark:border-apple-blue/30 hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition"
                                        >
                                          {exam.results.length} resultados
                                        </Badge>
                                        <span className="text-footnote text-muted-foreground">
                                          {formatDistanceToNow(exam.createdAt, {
                                            addSuffix: true,
                                            locale: ptBR,
                                          })}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Mobile Actions */}
                                    <div className="flex items-center justify-end pt-2 border-t border-apple-gray-4">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="tinted"
                                            size="sm"
                                            className="text-footnote"
                                            disabled={shouldDisableActions}
                                          >
                                            Ações
                                            <ChevronDown className="h-3 w-3 ml-1" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {shouldDisableActions ? (
                                            <DropdownMenuItem disabled>
                                              <Eye className="h-4 w-4 mr-3" />
                                              Ver Prova
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem asChild>
                                              <Link
                                                href={`/dashboard/exams/${exam._id}`}
                                              >
                                                <Eye className="h-4 w-4 mr-3" />
                                                Ver Prova
                                              </Link>
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExportWord(exam);
                                            }}
                                            disabled={
                                              exportingExamId === exam._id ||
                                              shouldDisableActions
                                            }
                                          >
                                            <Download className="h-4 w-4 mr-3" />
                                            {exportingExamId === exam._id
                                              ? "Gerando..."
                                              : "Download Word"}
                                          </DropdownMenuItem>
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <DropdownMenuItem
                                                onSelect={(e) =>
                                                  e.preventDefault()
                                                }
                                                disabled={shouldDisableActions}
                                              >
                                                <Share2 className="h-4 w-4 mr-3" />
                                                Gerar Link
                                              </DropdownMenuItem>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[500px]">
                                              <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                  <Share2 className="h-5 w-5" />
                                                  Compartilhar Prova
                                                </DialogTitle>
                                              </DialogHeader>
                                              <ShareExamContent
                                                exam={exam}
                                                toast={toast}
                                              />
                                            </DialogContent>
                                          </Dialog>
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <DropdownMenuItem
                                                onSelect={(e) =>
                                                  e.preventDefault()
                                                }
                                                disabled={shouldDisableActions}
                                              >
                                                <Copy className="h-4 w-4 mr-3" />
                                                Duplicar Prova
                                              </DropdownMenuItem>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                              <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                  <Copy className="h-5 w-5" />
                                                  Duplicar Prova
                                                </DialogTitle>
                                              </DialogHeader>
                                              <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                  <Label htmlFor="target-class">
                                                    Escolher Turma
                                                  </Label>
                                                  <Select
                                                    value={
                                                      selectedTargetClassId
                                                    }
                                                    onValueChange={(value) => {
                                                      setSelectedTargetClassId(
                                                        value
                                                      );
                                                      setIsCreatingNewClass(
                                                        false
                                                      );
                                                    }}
                                                  >
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Selecione uma turma" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {userData?.classes?.map(
                                                        (classItem: any) => (
                                                          <SelectItem
                                                            key={classItem._id}
                                                            value={
                                                              classItem._id
                                                            }
                                                          >
                                                            {classItem.name}
                                                          </SelectItem>
                                                        )
                                                      )}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <input
                                                    type="checkbox"
                                                    id="create-new-class"
                                                    checked={isCreatingNewClass}
                                                    onChange={(e) => {
                                                      setIsCreatingNewClass(
                                                        e.target.checked
                                                      );
                                                      if (e.target.checked) {
                                                        setSelectedTargetClassId(
                                                          ""
                                                        );
                                                      }
                                                    }}
                                                    className="rounded border-gray-300"
                                                  />
                                                  <Label
                                                    htmlFor="create-new-class"
                                                    className="text-sm"
                                                  >
                                                    Criar nova turma
                                                  </Label>
                                                </div>
                                                {isCreatingNewClass && (
                                                  <div className="space-y-2">
                                                    <Label htmlFor="new-class-name">
                                                      Nome da Nova Turma
                                                    </Label>
                                                    <Input
                                                      id="new-class-name"
                                                      placeholder="Digite o nome da nova turma"
                                                      value={
                                                        newClassNameForCopy
                                                      }
                                                      onChange={(e) =>
                                                        setNewClassNameForCopy(
                                                          e.target.value
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex justify-end gap-2 pt-4">
                                                <DialogClose asChild>
                                                  <Button
                                                    variant="outline"
                                                    disabled={isCopyingExam}
                                                    onClick={() => {
                                                      setIsCopyDialogOpen(
                                                        false
                                                      );
                                                      setExamToCopy(null);
                                                      setSelectedTargetClassId(
                                                        ""
                                                      );
                                                      setIsCreatingNewClass(
                                                        false
                                                      );
                                                      setNewClassNameForCopy(
                                                        ""
                                                      );
                                                    }}
                                                  >
                                                    Cancelar
                                                  </Button>
                                                </DialogClose>
                                                <Button
                                                  onClick={() => {
                                                    handleCopyExamToClass(exam);
                                                  }}
                                                  disabled={
                                                    isCopyingExam ||
                                                    (!isCreatingNewClass &&
                                                      !selectedTargetClassId) ||
                                                    (isCreatingNewClass &&
                                                      !newClassNameForCopy.trim())
                                                  }
                                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                  {isCopyingExam
                                                    ? isCreatingNewClass
                                                      ? "Criando turma e copiando..."
                                                      : "Copiando..."
                                                    : "Duplicar Prova"}
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExportExamResults(exam);
                                            }}
                                            disabled={
                                              shouldDisableActions ||
                                              exam.results.length === 0
                                            }
                                          >
                                            <FileSpreadsheet className="h-4 w-4 mr-3" />
                                            Exportar CSV
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteExam(exam._id);
                                            }}
                                            disabled={shouldDisableActions}
                                            className="text-apple-red hover:bg-apple-red/10 focus:bg-apple-red/10 focus:text-apple-red"
                                          >
                                            <Trash className="h-4 w-4 mr-3" />
                                            Deletar
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>

                                  {/* Desktop Layout */}
                                  <div className="hidden md:block">
                                    <div
                                      className="flex items-start justify-between cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExamDetail(exam._id);
                                      }}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h5 className="font-semibold text-body text-foreground truncate">
                                            {exam.title}
                                          </h5>
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-6 w-6 p-0 hover:bg-apple-gray-5/50 rounded-apple"
                                          >
                                            <div
                                              className={`transform apple-transition ${
                                                activeExam === exam._id
                                                  ? "rotate-90"
                                                  : "rotate-0"
                                              }`}
                                            >
                                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                          </Button>
                                        </div>

                                        {exam.description && (
                                          <p className="text-subhead text-muted-foreground mb-2 line-clamp-2">
                                            {exam.description}
                                          </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="secondary"
                                              className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light border-apple-blue/20 dark:border-apple-blue/30 hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition"
                                            >
                                              {exam.questions.length} questões
                                            </Badge>
                                            <Badge
                                              variant="secondary"
                                              className="bg-apple-blue/10 dark:bg-apple-blue/15 text-apple-blue dark:text-apple-blue-light border-apple-blue/20 dark:border-apple-blue/30 hover:bg-apple-blue/20 dark:hover:bg-apple-blue/25 apple-transition"
                                            >
                                              {exam.results.length} resultados
                                            </Badge>
                                            <span className="text-footnote text-muted-foreground">
                                              {formatDistanceToNow(
                                                exam.createdAt,
                                                {
                                                  addSuffix: true,
                                                  locale: ptBR,
                                                }
                                              )}
                                            </span>
                                          </div>

                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="tinted"
                                                size="sm"
                                                className="text-footnote"
                                                disabled={shouldDisableActions}
                                              >
                                                Ações
                                                <ChevronDown className="h-3 w-3 ml-1" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              {shouldDisableActions ? (
                                                <DropdownMenuItem disabled>
                                                  <Eye className="h-4 w-4 mr-3" />
                                                  Ver Prova
                                                </DropdownMenuItem>
                                              ) : (
                                                <DropdownMenuItem asChild>
                                                  <Link
                                                    href={`/dashboard/exams/${exam._id}`}
                                                  >
                                                    <Eye className="h-4 w-4 mr-3" />
                                                    Ver Prova
                                                  </Link>
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleExportWord(exam);
                                                }}
                                                disabled={
                                                  exportingExamId ===
                                                    exam._id ||
                                                  shouldDisableActions
                                                }
                                              >
                                                <Download className="h-4 w-4 mr-3" />
                                                {exportingExamId === exam._id
                                                  ? "Gerando..."
                                                  : "Download Word"}
                                              </DropdownMenuItem>
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <DropdownMenuItem
                                                    onSelect={(e) =>
                                                      e.preventDefault()
                                                    }
                                                    disabled={
                                                      shouldDisableActions
                                                    }
                                                  >
                                                    <Share2 className="h-4 w-4 mr-3" />
                                                    Gerar Link
                                                  </DropdownMenuItem>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[500px]">
                                                  <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                      <Share2 className="h-5 w-5" />
                                                      Compartilhar Prova
                                                    </DialogTitle>
                                                  </DialogHeader>
                                                  <ShareExamContent
                                                    exam={exam}
                                                    toast={toast}
                                                  />
                                                </DialogContent>
                                              </Dialog>
                                              <Dialog>
                                                <DialogTrigger asChild>
                                                  <DropdownMenuItem
                                                    onSelect={(e) =>
                                                      e.preventDefault()
                                                    }
                                                    disabled={
                                                      shouldDisableActions
                                                    }
                                                  >
                                                    <Copy className="h-4 w-4 mr-3" />
                                                    Duplicar Prova
                                                  </DropdownMenuItem>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                  <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                      <Copy className="h-5 w-5" />
                                                      Duplicar Prova
                                                    </DialogTitle>
                                                  </DialogHeader>
                                                  <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                      <Label htmlFor="target-class-2">
                                                        Escolher Turma
                                                      </Label>
                                                      <Select
                                                        value={
                                                          selectedTargetClassId
                                                        }
                                                        onValueChange={(
                                                          value
                                                        ) => {
                                                          setSelectedTargetClassId(
                                                            value
                                                          );
                                                          setIsCreatingNewClass(
                                                            false
                                                          );
                                                        }}
                                                      >
                                                        <SelectTrigger>
                                                          <SelectValue placeholder="Selecione uma turma" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {userData?.classes?.map(
                                                            (
                                                              classItem: any
                                                            ) => (
                                                              <SelectItem
                                                                key={
                                                                  classItem._id
                                                                }
                                                                value={
                                                                  classItem._id
                                                                }
                                                              >
                                                                {classItem.name}
                                                              </SelectItem>
                                                            )
                                                          )}
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <input
                                                        type="checkbox"
                                                        id="create-new-class-2"
                                                        checked={
                                                          isCreatingNewClass
                                                        }
                                                        onChange={(e) => {
                                                          setIsCreatingNewClass(
                                                            e.target.checked
                                                          );
                                                          if (
                                                            e.target.checked
                                                          ) {
                                                            setSelectedTargetClassId(
                                                              ""
                                                            );
                                                          }
                                                        }}
                                                        className="rounded border-gray-300"
                                                      />
                                                      <Label
                                                        htmlFor="create-new-class-2"
                                                        className="text-sm"
                                                      >
                                                        Criar nova turma
                                                      </Label>
                                                    </div>
                                                    {isCreatingNewClass && (
                                                      <div className="space-y-2">
                                                        <Label htmlFor="new-class-name-2">
                                                          Nome da Nova Turma
                                                        </Label>
                                                        <Input
                                                          id="new-class-name-2"
                                                          placeholder="Digite o nome da nova turma"
                                                          value={
                                                            newClassNameForCopy
                                                          }
                                                          onChange={(e) =>
                                                            setNewClassNameForCopy(
                                                              e.target.value
                                                            )
                                                          }
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex justify-end gap-2 pt-4">
                                                    <DialogClose asChild>
                                                      <Button
                                                        variant="outline"
                                                        disabled={isCopyingExam}
                                                        onClick={() => {
                                                          setIsCopyDialogOpen(
                                                            false
                                                          );
                                                          setExamToCopy(null);
                                                          setSelectedTargetClassId(
                                                            ""
                                                          );
                                                          setIsCreatingNewClass(
                                                            false
                                                          );
                                                          setNewClassNameForCopy(
                                                            ""
                                                          );
                                                        }}
                                                      >
                                                        Cancelar
                                                      </Button>
                                                    </DialogClose>
                                                    <Button
                                                      onClick={() => {
                                                        handleCopyExamToClass(
                                                          exam
                                                        );
                                                      }}
                                                      disabled={
                                                        isCopyingExam ||
                                                        (!isCreatingNewClass &&
                                                          !selectedTargetClassId) ||
                                                        (isCreatingNewClass &&
                                                          !newClassNameForCopy.trim())
                                                      }
                                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                      {isCopyingExam
                                                        ? isCreatingNewClass
                                                          ? "Criando turma e copiando..."
                                                          : "Copiando..."
                                                        : "Duplicar Prova"}
                                                    </Button>
                                                  </div>
                                                </DialogContent>
                                              </Dialog>
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleExportExamResults(exam);
                                                }}
                                                disabled={
                                                  shouldDisableActions ||
                                                  exam.results.length === 0
                                                }
                                              >
                                                <FileSpreadsheet className="h-4 w-4 mr-3" />
                                                Exportar CSV
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteExam(exam._id);
                                                }}
                                                disabled={shouldDisableActions}
                                                className="text-apple-red hover:bg-apple-red/10 focus:bg-apple-red/10 focus:text-apple-red"
                                              >
                                                <Trash className="h-4 w-4 mr-3" />
                                                Deletar
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expandable Results Section */}
                                  {activeExam === exam._id &&
                                    exam.results.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-apple-gray-4">
                                        <div className="mb-3">
                                          <h6 className="text-subhead font-semibold text-foreground">
                                            Resultados ({exam.results.length})
                                          </h6>
                                        </div>

                                        <div className="space-y-2">
                                          {(() => {
                                            const showMore =
                                              showMoreResults.has(exam._id);
                                            const maxResults = 3;
                                            const displayedResults = showMore
                                              ? exam.results
                                              : exam.results.slice(
                                                  0,
                                                  maxResults
                                                );

                                            return displayedResults.map(
                                              (result: any) => (
                                                <div
                                                  key={result._id}
                                                  className="flex items-center justify-between p-2 bg-apple-secondary-system-background rounded-apple border border-apple-gray-4 cursor-pointer hover:bg-apple-gray-5/50 transition-colors"
                                                  onClick={() => handleViewStudentAnswers(result._id)}
                                                >
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-footnote text-foreground truncate">
                                                      {result.email}
                                                    </p>
                                                    <p className="text-caption-2 text-muted-foreground">
                                                      {formatDate(
                                                        result.createdAt
                                                      )}
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-footnote font-medium text-foreground">
                                                      {result.score}/
                                                      {result.examQuestionCount}
                                                    </span>
                                                    <span
                                                      className={`text-footnote font-bold ${getPercentageColor(
                                                        result.percentage
                                                      )}`}
                                                    >
                                                      {(
                                                        result.percentage * 100
                                                      ).toFixed(1)}
                                                      %
                                                    </span>
                                                  </div>
                                                </div>
                                              )
                                            );
                                          })()}
                                        </div>

                                        {(() => {
                                          const showMore = showMoreResults.has(
                                            exam._id
                                          );
                                          const maxResults = 3;
                                          const hasMoreResults =
                                            exam.results.length > maxResults;

                                          return hasMoreResults ? (
                                            <div className="mt-3 text-center">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleShowMoreResults(
                                                    exam._id
                                                  );
                                                }}
                                                className="text-footnote text-apple-blue hover:bg-apple-blue/10"
                                              >
                                                {showMore
                                                  ? `Mostrar menos (${
                                                      exam.results.length -
                                                      maxResults
                                                    } ocultos)`
                                                  : `Mostrar mais ${
                                                      exam.results.length -
                                                      maxResults
                                                    } resultado(s)`}
                                              </Button>
                                            </div>
                                          ) : null;
                                        })()}
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
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
              ))
            ) : (
              <Card className="hover:apple-shadow apple-transition">
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-headline font-semibold text-foreground mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-subhead text-muted-foreground">
                    Tente ajustar sua pesquisa ou verifique a ortografia.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-apple-shadow dark:border-apple-gray-4 dark:bg-apple-secondary-grouped-background">
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
                    Comece criando sua primeira turma para organizar suas
                    provas.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button disabled={shouldDisableActions}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Turma
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          Criar Nova Turma
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-class-name-empty">
                            Nome da Turma
                          </Label>
                          <Input
                            id="new-class-name-empty"
                            placeholder="Digite o nome da turma"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <DialogClose asChild>
                          <Button variant="outline" disabled={isCreatingClass}>
                            Cancelar
                          </Button>
                        </DialogClose>
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
                              <Plus className="h-4 w-4 mr-2" />
                              Criar Turma
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                disabled={isUpdating}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdating}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </DialogClose>
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

      {/* Student Answers Dialog */}
      <StudentAnswersDialog
        isOpen={isStudentAnswersDialogOpen}
        onClose={() => setIsStudentAnswersDialogOpen(false)}
        resultId={selectedResultId}
      />
    </>
  );
}

// Share Exam Content Component
interface ShareExamContentProps {
  exam: ExamData;
  toast: any;
}

function ShareExamContent({ exam, toast }: ShareExamContentProps) {
  const [config, setConfig] = React.useState({
    allowConsultation: false,
    showScoreAtEnd: true,
    showCorrectAnswersAtEnd: false,
  });
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleConfigChange = (key: string, value: boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const encodeConfig = (config: any): string => {
    const configString = JSON.stringify(config);
    return btoa(configString);
  };

  const shareOrCopyLink = async (
    shareUrl: string
  ): Promise<{ success: boolean; method: string }> => {
    // Try Web Share API first (works great on Safari mobile)
    if (
      navigator.share &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({
          title: exam.title,
          text: "Acesse esta prova:",
          url: shareUrl,
        });
        return { success: true, method: "share" };
      } catch (err) {
        // User cancelled share or API failed
        console.warn("Web Share API failed:", err);
      }
    }

    // Try clipboard API with immediate execution (preserves user gesture)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, method: "clipboard" };
      } catch (err) {
        console.warn("Modern clipboard API failed:", err);
      }
    }

    // Fallback for older browsers
    try {
      // Store the currently focused element to restore focus later
      const activeElement = document.activeElement as HTMLElement;

      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      // Restore focus to the previously focused element
      if (activeElement && typeof activeElement.focus === "function") {
        activeElement.focus();
      }

      if (successful) {
        return { success: true, method: "execCommand" };
      }
    } catch (err) {
      console.error("Fallback clipboard failed:", err);
    }

    return { success: false, method: "none" };
  };

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);

      // Generate the share URL first
      const response = await axios.post("/api/exam/share", {
        examId: exam._id,
      });
      const encodedConfig = encodeConfig(config);
      const shareUrl = `${window.location.origin}/exam/${response.data.id}?c=${encodedConfig}`;

      // Try to share or copy immediately (preserves user gesture)
      const result = await shareOrCopyLink(shareUrl);

      if (result.success) {
        if (result.method === "share") {
          toast({
            title: "Prova Compartilhada!",
            description: "O link da prova foi compartilhado com sucesso.",
          });
        } else {
          toast({
            title: "Link da Prova Copiado!",
            description:
              "O link da prova foi copiado com as configurações de segurança aplicadas.",
          });
        }
        // Don't auto-close dialog, let user close manually
      } else {
        // Fallback: show the URL so user can copy manually
        toast({
          title: "Link da Prova Gerado!",
          description: `Link: ${shareUrl}`,
          duration: 15000, // Show longer so user can copy
        });
        // Don't auto-close dialog, let user close manually
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
            <p className="text-sm font-medium">
              Permitir consulta durante a prova
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Alunos podem acessar materiais de apoio durante a realização
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowConsultation}
              onChange={(e) =>
                handleConfigChange("allowConsultation", e.target.checked)
              }
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
              onChange={(e) =>
                handleConfigChange("showScoreAtEnd", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Mostrar respostas corretas ao final
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Revelar as respostas corretas após a conclusão da prova
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCorrectAnswersAtEnd}
              onChange={(e) =>
                handleConfigChange("showCorrectAnswersAtEnd", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end pt-4 border-t">
        <DialogClose asChild>
          <Button variant="outline" disabled={isGenerating}>
            Cancelar
          </Button>
        </DialogClose>
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
