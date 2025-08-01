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
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Award,
  Users,
  BookOpen,
  ChevronRight,
  Download,
  Share2,
  Trash,
  Eye,
  Clock,
  Target,
  Calendar,
} from "lucide-react";
import React from "react";
import axios from "axios";
import { DBClass, DBExam } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";
import { exportExamToWord } from "@/lib/word-export";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

function ExamsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg px-6 py-4 shadow-sm bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

interface ExamWithResults extends DBExam {
  results: Result[];
  className: string;
  classId: string;
}

interface ClassWithExams {
  id: string;
  name: string;
  exams: ExamWithResults[];
  totalResults: number;
  totalQuestions: number;
}

export default function ListExamsPage() {
  const [classes, setClasses] = React.useState<ClassWithExams[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [expandedClasses, setExpandedClasses] = React.useState<Set<string>>(new Set());
  const [expandedExams, setExpandedExams] = React.useState<Set<string>>(new Set());
  const [showMoreResults, setShowMoreResults] = React.useState<Set<string>>(new Set());
  const [exportingExamId, setExportingExamId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const [examsResponse, resultsResponse] = await Promise.all([
        axios.get("/api/exam/all"),
        axios.get("/api/class")
      ]);
      
      const classesData = examsResponse.data.data;
      const classResults = resultsResponse.data.data;
      
      // Transform data to class-centric view with exams
      const classesWithExams: ClassWithExams[] = [];
      
      classesData.forEach((classItem: DBClass) => {
        const classResultsData = classResults.find((cr: any) => cr.id === classItem.id);
        
        const examsWithResults: ExamWithResults[] = classItem.exams.map((exam: DBExam) => {
          const examResults = classResultsData?.results?.filter((result: Result) => 
            result.examId === exam._id
          ) || [];
          
          return {
            ...exam,
            results: examResults,
            className: classItem.name,
            classId: classItem.id,
          };
        });

        const totalResults = examsWithResults.reduce((acc, exam) => acc + exam.results.length, 0);
        const totalQuestions = examsWithResults.reduce((acc, exam) => acc + exam.questions.length, 0);
        
        // Only include classes that have exams
        if (examsWithResults.length > 0) {
          classesWithExams.push({
            id: classItem.id,
            name: classItem.name,
            exams: examsWithResults,
            totalResults,
            totalQuestions,
          });
        }
      });
      
      setClasses(classesWithExams);
    } catch (error) {
      toast({
        title: "Erro ao carregar provas",
        description: "Não foi possível carregar as provas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const handleDeleteExam = async (examId: string) => {
    try {
      const response = await axios.delete("/api/exam", {
        data: { examId },
      });

      if (response.status === 200) {
        toast({
          title: "Prova deletada com sucesso",
        });
        fetchExams();
      } else {
        toast({
          title: "Falha ao deletar prova",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar prova",
        description: "Ocorreu um erro ao deletar a prova. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleExportWord = async (exam: ExamWithResults) => {
    try {
      setExportingExamId(exam._id);
      await exportExamToWord(exam, false);
      toast({
        title: "Documento Word exportado com sucesso!",
        description: "A prova foi salva no seu dispositivo.",
      });
    } catch (error) {
      console.error("Error exporting Word document:", error);
      toast({
        title: "Erro ao exportar documento",
        description: "Ocorreu um erro ao gerar o documento Word. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingExamId(null);
    }
  };

  // Calculate summary statistics
  const totalExams = classes.reduce((acc, cls) => acc + cls.exams.length, 0);
  const totalResults = classes.reduce((acc, cls) => acc + cls.totalResults, 0);
  const totalQuestions = classes.reduce((acc, cls) => acc + cls.totalQuestions, 0);

  React.useEffect(() => {
    fetchExams();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading="Minhas Provas"
          text="Gerencie suas provas e acompanhe o desempenho dos seus alunos"
        />
        <Button onClick={() => router.push("/dashboard/exams/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Prova
        </Button>
      </div>

      <div className="space-y-6 mt-4">
        {isLoading ? (
          <ExamsSkeleton />
        ) : classes?.length > 0 ? (
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
                      {classes.length}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      Com provas
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
                      {totalExams}
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
                      Total de Questões
                    </p>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {totalQuestions}
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

            {/* Classes with Exams List */}
            <div className="space-y-4">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                  <CardHeader>
                    <div className="flex items-center justify-between">
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
                            <Users className="h-5 w-5" />
                            {classItem.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                            {classItem.exams.length} prova(s) • {classItem.totalResults} resultado(s) • {classItem.totalQuestions} questões
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          {classItem.exams.length} provas
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                          {classItem.totalResults} resultados
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedClasses.has(classItem.id) && (
                    <CardContent>
                      <div className="space-y-4">
                        {classItem.exams.map((exam) => {
                    const isExpanded = expandedExams.has(exam._id);
                    const showMore = showMoreResults.has(exam._id);
                    const maxResults = 3;
                    const displayedResults = showMore ? exam.results : exam.results.slice(0, maxResults);
                    const hasMoreResults = exam.results.length > maxResults;

                    return (
                      <div
                        key={exam._id}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        {/* Main Exam Row */}
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-all duration-200">
                          {/* Mobile Layout */}
                          <div className="block md:hidden">
                            <div className="flex items-start gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExamExpansion(exam._id)}
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
                                    {exam.title}
                                  </h4>
                                  {exam.description && (
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                      {exam.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Turma: {exam.className}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 dark:text-zinc-400 text-sm">
                                    {exam.questions.length} questões • 
                                  </span>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    {exam.results.length} resultados
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-6">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExamExpansion(exam._id)}
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
                                    {exam.title}
                                  </p>
                                  {exam.description && (
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                      {exam.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Turma: {exam.className}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2 text-center font-medium">
                              {exam.questions.length} questões
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                {exam.results.length} resultados
                              </span>
                            </div>
                            <div className="col-span-2 text-sm text-gray-600 dark:text-zinc-400">
                              {formatDistanceToNow(exam.createdAt, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
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
                                  Ações da Prova
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="flex items-center gap-2"
                                >
                                  <Link href={`/dashboard/exams/${exam._id}`}>
                                    <Eye className="h-3 w-3" />
                                    Ver
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportWord(exam)}
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
                                >
                                  <Share2 className="h-3 w-3" />
                                  Compartilhar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                                  onClick={() => handleDeleteExam(exam._id)}
                                >
                                  <Trash className="h-3 w-3" />
                                  Deletar
                                </Button>
                              </div>
                            </div>

                            {/* Results Section */}
                            {exam.results.length > 0 ? (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                                  <h4 className="font-medium text-gray-700 dark:text-zinc-300">
                                    Resultados ({exam.results.length})
                                  </h4>
                                </div>

                                {/* Mobile Results Layout */}
                                <div className="md:hidden space-y-2">
                                  {displayedResults.map((result: Result) => (
                                    <div
                                      key={result._id}
                                      className="bg-gray-50 dark:bg-zinc-800 rounded p-2 border text-sm"
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

                                {/* Show More Button */}
                                {hasMoreResults && (
                                  <div className="mt-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleShowMoreResults(exam._id)}
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
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                  Ainda não existem resultados para esta prova
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
                  <FileText className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-50 mb-2">
                    Nenhuma prova encontrada
                  </h3>
                  <p className="text-gray-500 dark:text-zinc-400 mb-4">
                    Você ainda não criou nenhuma prova. Comece criando sua primeira prova.
                  </p>
                  <Button onClick={() => router.push("/dashboard/exams/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Prova
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}