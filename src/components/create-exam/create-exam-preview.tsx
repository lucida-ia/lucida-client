"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Clock,
  Loader2,
  Settings,
  Target,
  CheckCircle,
  Timer,
  FileCheck,
  Zap,
  HelpCircle,
  BookOpen,
  Users,
  Hash,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import axios from "axios";

interface DifficultyDistribution {
  fácil: number;
  médio: number;
  difícil: number;
}

interface ExamConfig {
  title: string;
  description: string;
  questionStyle: "simple" | "enem" | "enade";
  questionCount: number;
  class: {
    _id: string;
    name: string;
  };
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    shortAnswer: boolean;
    essay: boolean;
  };
  difficulty: string;
  timeLimit: number;
  difficultyDistribution?: DifficultyDistribution;
}

interface CreateExamPreviewProps {
  files: File[];
  youtubeUrls?: string[];
  youtubeVideoData?: Record<string, { title?: string; videoId?: string }>;
  config: ExamConfig;
  onBack: () => void;
  onExamGenerated: (exam: any) => void;
  onSetStopLoadingCallback: (callback: () => void) => void;
  shouldDisableActions?: boolean;
}

export function CreateExamPreview({
  files,
  youtubeUrls = [],
  youtubeVideoData = {},
  config,
  onBack,
  onExamGenerated,
  onSetStopLoadingCallback,
  shouldDisableActions = false,
}: CreateExamPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState(
    "Preparando recursos..."
  );
  const progressTimersRef = useRef<NodeJS.Timeout[]>([]);
  const { toast } = useToast();

  // Clear progress timers helper
  const clearProgressTimers = () => {
    progressTimersRef.current.forEach((t) => clearTimeout(t));
    progressTimersRef.current = [];
  };

  // Register the stop loading callback with the parent component
  useEffect(() => {
    const stopLoading = () => {
      clearProgressTimers();
      setIsGenerating(false);
      setProgressMessage("Preparando recursos...");
    };
    onSetStopLoadingCallback(stopLoading);
  }, [onSetStopLoadingCallback]);

  const handleUploadFilesAndGenerateQuestions = async (files: File[]) => {
    try {
      setIsGenerating(true);

      // Estimate durations and schedule messages
      const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
      const estimatedTokens = Math.ceil(totalBytes / 4); // ≈4 bytes / token
      const processingSec = estimatedTokens * 0.00027429;
      const generationSec = config.questionCount * 1.8;

      type Step = { msg: string; pct: number };
      const processingSteps: Step[] = [
        { msg: "Lendo seu conteúdo", pct: 0.2 },
        { msg: "Analisando principais pontos", pct: 0.3 },
        { msg: "Selecionando principais pontos", pct: 0.3 },
        { msg: "Revisando seu conteúdo", pct: 0.2 },
      ];
      const generationSteps: Step[] = [
        { msg: "Criando perguntas", pct: 0.4 },
        { msg: "Criando alternativas", pct: 0.3 },
        { msg: "Explicando respostas das questões", pct: 0.3 },
      ];

      let delayAcc = 0;
      const schedule = (steps: Step[], total: number) => {
        steps.forEach(({ msg, pct }) => {
          const t = setTimeout(
            () => setProgressMessage(msg),
            (delayAcc + total * pct) * 1000
          );
          progressTimersRef.current.push(t);
          delayAcc += total * pct;
        });
      };

      schedule(processingSteps, processingSec);
      schedule(generationSteps, generationSec);

      // Step 1: Generate exam
      const formData = new FormData();

      for (const file of files) {
        formData.append("files", file);
      }

      formData.append("config", JSON.stringify(config));

      if (youtubeUrls.length > 0) {
        formData.append("youtubeUrls", JSON.stringify(youtubeUrls));
      }

      const response = await axios(
        // "http://localhost:8080/ai-ops/generate-exam",
        "https://lucida-api-production.up.railway.app/ai-ops/generate-exam",

        {
          method: "POST",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = response.data;

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.error,
        });
        return;
      }

      if (data.results) {
        const errors = data.results.filter((result: any) => !result.success);
        const successes = data.results.filter((result: any) => result.success);

        if (errors.length > 0) {
          errors.forEach((error: any) => {
            toast({
              variant: "destructive",
              title: `Erro ao processar ${error.fileName}`,
              description: error.error,
            });
          });
        }

        if (successes.length > 0) {
          const totalTokens = successes.reduce(
            (sum: number, result: any) => sum + result.extractedTokens,
            0
          );
          const totalWords = Math.round(totalTokens * 0.75);
          toast({
            variant: "default",
            title: "Arquivos processados com sucesso",
            description: `${
              successes.length
            } arquivo(s) processado(s) (≈${totalWords.toLocaleString()} palavras)`,
          });
        }

        // If no files were successfully processed, don't proceed
        if (successes.length === 0) {
          return;
        }
      }

      // Step 2: Save exam (continue with loading state)
      // Call the callback with the generated exam data - this will handle saving and redirect
      onExamGenerated(data);

      // Note: Don't set setIsGenerating(false) here - let the parent component handle it
      // after the save is complete
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Falha ao processar os arquivos. Por favor, tente novamente.",
      });
      setIsGenerating(false);
    }
    // Note: Don't set setIsGenerating(false) here in the finally block
    // The parent component will handle stopping the loading state after save is complete
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "fácil":
        return "bg-green-50 text-[#34C759] border-green-200 dark:bg-green-950/30 dark:text-[#32D74B] dark:border-green-800/50 font-semibold";
      case "médio":
        return "bg-orange-50 text-[#FF9500] border-orange-200 dark:bg-orange-950/30 dark:text-[#FF9F0A] dark:border-orange-800/50 font-semibold";
      case "difícil":
        return "bg-red-50 text-[#FF3B30] border-red-200 dark:bg-red-950/30 dark:text-[#FF453A] dark:border-red-800/50 font-semibold";
      case "misto":
        return "bg-blue-50 text-[#007AFF] border-blue-200 dark:bg-blue-950/30 dark:text-[#0A84FF] dark:border-blue-800/50 font-semibold";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
  };

  const capitalizeDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "fácil":
        return "Fácil";
      case "médio":
        return "Médio";
      case "difícil":
        return "Difícil";
      case "misto":
        return "Misto";
      default:
        return difficulty || "Não definido";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "fácil":
        return <Target className="h-4 w-4" />;
      case "médio":
        return <Settings className="h-4 w-4" />;
      case "difícil":
        return <Zap className="h-4 w-4" />;
      case "misto":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "multipleChoice":
        return <CheckCircle className="h-4 w-4" />;
      case "trueFalse":
        return <HelpCircle className="h-4 w-4" />;
      case "shortAnswer":
        return <FileText className="h-4 w-4" />;
      case "essay":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const activeQuestionTypes = Object.entries(config.questionTypes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => {
      if (type === "multipleChoice")
        return { key: type, label: "Múltipla Escolha" };
      if (type === "trueFalse") return { key: type, label: "Verdadeiro/Falso" };
      if (type === "shortAnswer") return { key: type, label: "Resposta Curta" };
      if (type === "essay") return { key: type, label: "Dissertativa" };
      return { key: type, label: type };
    });

  return (
    <div className="space-y-8">
      {/* Loading Modal */}
      <Dialog open={isGenerating} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-lg [&>button]:hidden border-gray-200 dark:border-gray-800 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Gerando Prova</DialogTitle>

          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 opacity-50"></div>

          <div className="relative flex flex-col items-center justify-center py-12 px-6">
            {/* Main icon container with glow */}
            <div className="relative mb-8">
              {/* Outer glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>

              {/* Icon container */}
              <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-3xl shadow-2xl border-2 border-white/50 dark:border-gray-700/50">
                <div className="relative">
                  <Sparkles className="animate-pulse h-14 w-14 text-[#007AFF] dark:text-[#0A84FF] drop-shadow-[0_0_12px_rgba(0,122,255,0.6)] dark:drop-shadow-[0_0_16px_rgba(10,132,255,0.8)]" />
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="text-center space-y-4 max-w-md">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Gerando e Salvando Prova
                </h3>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              </div>

              <div className="p-4 bg-white/60 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#007AFF] dark:text-[#0A84FF] animate-pulse" />
                  {progressMessage}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns momentos...
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <div className="h-3 w-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-lg"></div>
              <div className="h-3 w-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-lg"></div>
              <div className="h-3 w-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full animate-bounce shadow-lg"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Details Card */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <FileText className="h-6 w-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold tracking-tight">
                Detalhes da Prova
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Informações gerais sobre a prova que será gerada.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold text-lg md:text-xl mb-2">
              {config.title}
            </h4>
            {config.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {config.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-5 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Users className="h-5 w-5 text-[#007AFF] dark:text-[#0A84FF]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Turma
                </p>
                <p className="text-base font-semibold">{config.class.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <GraduationCap className="h-5 w-5 text-[#007AFF] dark:text-[#0A84FF]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Tipo de Prova
                </p>
                <p className="text-base font-semibold">
                  {config.questionStyle.charAt(0).toUpperCase() +
                    config.questionStyle.slice(1)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Timer className="h-5 w-5 text-[#007AFF] dark:text-[#0A84FF]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Tempo Limite
                </p>
                <p className="text-base font-semibold">
                  {config.timeLimit} minutos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-5 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <Target className="h-5 w-5 text-[#007AFF] dark:text-[#0A84FF]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Dificuldade
                </p>
                <Badge
                  className={`${getDifficultyColor(
                    config.difficulty
                  )} border-2 px-3 py-1`}
                >
                  {capitalizeDifficulty(config.difficulty)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Configuration Card */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <Settings className="h-6 w-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold tracking-tight">
                Configuração das Questões
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Detalhes sobre os tipos e quantidade de questões.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-6 border-2 border-blue-200 dark:border-blue-800/50 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
              <Hash className="h-7 w-7 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Total de Questões
              </p>
              <p className="text-3xl font-bold text-foreground">
                {config.questionCount}
              </p>
            </div>
            <Badge className="px-4 py-2 rounded-lg font-semibold bg-[#007AFF] hover:bg-[#0066DD] text-white">
              {config.questionCount} questões
            </Badge>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Tipos de Questões Habilitados
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeQuestionTypes.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {getQuestionTypeIcon(key)}
                  </div>
                  <span className="text-sm font-semibold flex-1">{label}</span>
                  <CheckCircle className="h-5 w-5 text-[#34C759] dark:text-[#32D74B]" />
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Distribution - Only shown when "misto" is selected */}
          {config.difficulty === "misto" && config.difficultyDistribution && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Distribuição de Dificuldade
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-4 border-2 border-green-200 dark:border-green-800/50 rounded-xl bg-green-50 dark:bg-green-950/30">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-[#34C759] dark:bg-[#32D74B] rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#34C759] dark:text-[#32D74B] uppercase tracking-wider mb-0.5">
                      Fácil
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {config.difficultyDistribution.fácil}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border-2 border-orange-200 dark:border-orange-800/50 rounded-xl bg-orange-50 dark:bg-orange-950/30">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-[#FF9500] dark:bg-[#FF9F0A] rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#FF9500] dark:text-[#FF9F0A] uppercase tracking-wider mb-0.5">
                      Médio
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {config.difficultyDistribution.médio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border-2 border-red-200 dark:border-red-800/50 rounded-xl bg-red-50 dark:bg-red-950/30">
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <div className="w-3 h-3 bg-[#FF3B30] dark:bg-[#FF453A] rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A] uppercase tracking-wider mb-0.5">
                      Difícil
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {config.difficultyDistribution.difícil}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Materials Card */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <FileCheck className="h-6 w-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold tracking-tight">
                Materiais de Origem
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Arquivos que serão processados para gerar as questões.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all"
              >
                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-[#34C759] dark:text-[#32D74B] flex-shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* YouTube Videos Card */}
      {youtubeUrls.length > 0 && (
        <Card className="hover:border-primary/20 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <svg
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Vídeos do YouTube</h3>
                <p className="text-sm text-muted-foreground">
                  {youtubeUrls.length} vídeo
                  {youtubeUrls.length !== 1 ? "s" : ""} adicionado
                  {youtubeUrls.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {youtubeUrls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <svg
                      className="h-4 w-4 text-red-600 dark:text-red-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {youtubeVideoData[url]?.title || url}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vídeo do YouTube
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Card */}
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700/50 shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
              <Zap className="h-6 w-6 text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold tracking-tight">
                Gerar e Salvar Prova
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Tudo pronto! Clique no botão para processar os materiais e gerar
                as questões.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="space-y-6">
            <div className="relative inline-block">
              <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl shadow-lg">
                <Sparkles className="h-12 w-12 text-[#007AFF] dark:text-[#0A84FF] drop-shadow-[0_0_8px_rgba(0,122,255,0.5)] dark:drop-shadow-[0_0_12px_rgba(10,132,255,0.6)] animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#34C759] dark:bg-[#32D74B] rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">
                Pronto para Gerar!
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                Processaremos seus arquivos e criaremos questões personalizadas
                baseadas no seu conteúdo
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isGenerating || shouldDisableActions}
            className="h-11 px-6 rounded-xl font-medium gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Personalização</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <Button
            onClick={() => handleUploadFilesAndGenerateQuestions(files)}
            disabled={isGenerating || shouldDisableActions}
            className="h-11 px-6 rounded-xl font-medium gap-2 w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Gerando e Salvando...</span>
                <span className="sm:hidden">Gerando...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Gerar e Salvar Prova</span>
                <span className="sm:hidden">Gerar</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
