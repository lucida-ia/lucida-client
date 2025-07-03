"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
} from "lucide-react";
import axios from "axios";

interface ExamConfig {
  title: string;
  description: string;
  questionCount: number;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    shortAnswer: boolean;
    essay: boolean;
  };
  difficulty: string;
  timeLimit: number;
}

interface CreateExamPreviewProps {
  files: File[];
  config: ExamConfig;
  onBack: () => void;
  onExamGenerated: (exam: any) => void;
}

export function CreateExamPreview({
  files,
  config,
  onBack,
  onExamGenerated,
}: CreateExamPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleUploadFilesAndGenerateQuestions = async (files: File[]) => {
    try {
      setIsGenerating(true);
      const formData = new FormData();

      for (const file of files) {
        formData.append("files", file);
      }

      formData.append("config", JSON.stringify(config));

      const response = await axios(
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
        const errors = data.results.filter((result: any) => result.error);
        if (errors.length > 0) {
          errors.forEach((error: any) => {
            toast({
              variant: "destructive",
              title: `Erro ao processar ${error.fileName}`,
              description: error.error,
            });
          });
        }
        const successfulResults = data.results.filter(
          (result: any) => result.questions
        );
      }

      // Call the callback with the generated exam data
      onExamGenerated(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Falha ao processar os arquivos. Por favor, tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "mixed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <Target className="h-4 w-4" />;
      case "medium":
        return <Settings className="h-4 w-4" />;
      case "hard":
        return <Zap className="h-4 w-4" />;
      case "mixed":
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
      {/* Exam Details Card */}
      <Card className="hover:border-primary/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Detalhes da Prova</CardTitle>
              <CardDescription>
                Informações gerais sobre a prova que será gerada.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg border transition-colors">
            <h4 className="font-semibold text-lg mb-1">{config.title}</h4>
            {config.description && (
              <p className="text-muted-foreground text-sm">
                {config.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Timer className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tempo Limite
                </p>
                <p className="text-lg font-semibold">
                  {config.timeLimit} minutos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                {getDifficultyIcon(config.difficulty)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dificuldade
                </p>
                <Badge
                  className={`${getDifficultyColor(
                    config.difficulty
                  )} font-medium`}
                >
                  {config.difficulty === "easy" && "Fácil"}
                  {config.difficulty === "medium" && "Médio"}
                  {config.difficulty === "hard" && "Difícil"}
                  {config.difficulty === "mixed" && "Misto"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Configuration Card */}
      <Card className="hover:border-primary/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Configuração das Questões
              </CardTitle>
              <CardDescription>
                Detalhes sobre os tipos e quantidade de questões.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Questões
              </p>
              <p className="text-2xl font-bold">{config.questionCount}</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {config.questionCount} questões
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Tipos de Questões Habilitados</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeQuestionTypes.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-1 bg-muted rounded">
                    {getQuestionTypeIcon(key)}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Materials Card */}
      <Card className="hover:border-primary/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Materiais de Origem</CardTitle>
              <CardDescription>
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
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generation Card */}
      <Card className="hover:border-primary/20 transition-colors border-2 border-dashed">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Gerar Prova</CardTitle>
              <CardDescription>
                Tudo pronto! Clique no botão para processar os materiais e gerar
                as questões.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pronto para Gerar!</h3>
              <p className="text-muted-foreground text-sm">
                Processaremos seus arquivos e criaremos questões personalizadas
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isGenerating}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Personalização
          </Button>
          <Button
            onClick={() => handleUploadFilesAndGenerateQuestions(files)}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Prova...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Gerar Prova
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
