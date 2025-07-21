"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import axios from "axios";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FileText,
  Settings,
  Clock,
  Users,
  Target,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Plus,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  difficultyDistribution?: DifficultyDistribution;
  timeLimit: number;
}

interface CreateExamCustomizeProps {
  files: File[];
  initialConfig: ExamConfig;
  onConfigured: (config: ExamConfig) => void;
  onBack: () => void;
}

export function CreateExamCustomize({
  files,
  initialConfig,
  onConfigured,
  onBack,
}: CreateExamCustomizeProps) {
  const [config, setConfig] = useState<ExamConfig>(initialConfig);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [isCreatingClass, setIsCreatingClass] = React.useState(false);
  const [newClassName, setNewClassName] = React.useState("");
  const [showCreateClass, setShowCreateClass] = React.useState(false);
  const [difficultyDistribution, setDifficultyDistribution] =
    useState<DifficultyDistribution>({
      fácil: Math.floor(config.questionCount / 3),
      médio: Math.floor(config.questionCount / 3),
      difícil: config.questionCount - 2 * Math.floor(config.questionCount / 3),
    });
  const { toast } = useToast();
  const { subscription } = useSubscription();

  // Determine max questions based on subscription plan
  const maxQuestions = subscription?.plan === "trial" ? 10 : 50;

  useEffect(() => {
    if (config.questionStyle === "enem" || config.questionStyle === "enade") {
      setConfig((prev) => ({
        ...prev,
        questionTypes: {
          multipleChoice: true,
          trueFalse: false,
          shortAnswer: false,
          essay: false,
        },
      }));
    }
  }, [config.questionStyle]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuestionCountChange = (value: number[]) => {
    const newCount = value[0];

    // Check trial user question limit
    if (subscription?.plan === "trial" && newCount > 10) {
      toast({
        variant: "destructive",
        title: "Limite de questões para usuários Grátis",
        description:
          "Usuários Grátis podem criar provas com no máximo 10 questões. Faça upgrade para criar provas com mais questões.",
      });
      return;
    }

    setConfig((prev) => ({ ...prev, questionCount: newCount }));

    // Update difficulty distribution proportionally
    const newDistribution = {
      fácil: Math.floor(newCount / 3),
      médio: Math.floor(newCount / 3),
      difícil: newCount - 2 * Math.floor(newCount / 3),
    };
    setDifficultyDistribution(newDistribution);

    // Update config if misto is selected
    if (config.difficulty === "misto") {
      setConfig((prev) => ({
        ...prev,
        questionCount: newCount,
        difficultyDistribution: newDistribution,
      }));
    }
  };

  const handleTimeLimitChange = (value: number[]) => {
    setConfig((prev) => ({ ...prev, timeLimit: value[0] }));
  };

  const handleQuestionTypeChange = (
    type: keyof typeof config.questionTypes,
    checked: boolean
  ) => {
    setConfig((prev) => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: checked,
      },
    }));
  };

  const handleDifficultyChange = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      difficulty: value,
      difficultyDistribution:
        value === "misto" ? difficultyDistribution : undefined,
    }));
  };

  const handleDifficultyDistributionChange = (
    difficulty: keyof DifficultyDistribution,
    value: number
  ) => {
    const newDistribution = { ...difficultyDistribution, [difficulty]: value };
    setDifficultyDistribution(newDistribution);

    if (config.difficulty === "misto") {
      setConfig((prev) => ({
        ...prev,
        difficultyDistribution: newDistribution,
      }));
    }
  };

  const handleClassChange = (value: string) => {
    if (value === "create-new") {
      setShowCreateClass(true);
      setNewClassName("");
    } else {
      const selectedClass = classes.find((c) => (c.id || c._id) === value);

      setConfig((prev) => ({
        ...prev,
        class: {
          _id: value,
          name: selectedClass?.name || value,
        },
      }));
      setShowCreateClass(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para a turma.",
      });
      return;
    }

    try {
      setIsCreatingClass(true);
      const response = await axios.post("/api/class", {
        name: newClassName.trim(),
        description: `Turma criada durante a criação da prova: ${config.title}`,
      });

      if (response.status === 200 || response.status === 201) {
        const newClass = response.data.data;

        // Add the new class to the classes array
        setClasses((prev) => {
          const updated = [...prev, newClass];
          return updated;
        });

        // Set the new class as selected with a small delay to ensure state updates
        setTimeout(() => {
          const classId = newClass.id || newClass._id;
          setConfig((prev) => ({
            ...prev,
            class: {
              _id: classId,
              name: newClass.name,
            },
          }));
        }, 200);

        setShowCreateClass(false);
        setNewClassName("");
        toast({
          title: "Turma criada com sucesso!",
          description: `A turma "${newClassName}" foi criada e selecionada.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar turma",
        description: "Não foi possível criar a turma. Tente novamente.",
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleQuestionStyleChange = (value: "simple" | "enem" | "enade") => {
    if (value) {
      setConfig((prev) => ({ ...prev, questionStyle: value }));
    }
  };

  const validateConfig = () => {
    if (!config.title.trim()) {
      toast({
        variant: "destructive",
        title: "Título obrigatório",
        description: "Por favor, forneça um título para sua prova.",
      });
      return false;
    }

    if (!config.class._id) {
      toast({
        variant: "destructive",
        title: "Turma obrigatória",
        description: "Por favor, selecione uma turma para sua prova.",
      });
      return false;
    }

    const hasQuestionType = Object.values(config.questionTypes).some(
      (value) => value
    );
    if (!hasQuestionType) {
      toast({
        variant: "destructive",
        title: "Tipo de questão obrigatório",
        description: "Por favor, selecione pelo menos um tipo de questão.",
      });
      return false;
    }

    // Validate difficulty distribution for "misto" difficulty
    if (config.difficulty === "misto") {
      if (!config.difficultyDistribution) {
        toast({
          variant: "destructive",
          title: "Distribuição de dificuldade obrigatória",
          description:
            "Por favor, defina a distribuição de dificuldade para questões mistas.",
        });
        return false;
      }

      const total =
        config.difficultyDistribution.fácil +
        config.difficultyDistribution.médio +
        config.difficultyDistribution.difícil;
      if (total > config.questionCount) {
        toast({
          variant: "destructive",
          title: "Distribuição inválida",
          description: `O total de questões (${total}) não pode exceder o número de questões (${config.questionCount}).`,
        });
        return false;
      }

      if (total === 0) {
        toast({
          variant: "destructive",
          title: "Distribuição inválida",
          description:
            "Pelo menos uma questão deve ser definida na distribuição de dificuldade.",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateConfig()) {
      onConfigured(config);
    }
  };

  const handleReviewConfig = () => {
    if (validateConfig()) {
      onConfigured(config);
    }
  };

  React.useEffect(() => {
    const fetchClasses = async () => {
      const response = await axios.get("/api/class");
      setClasses(response.data.data);
    };
    fetchClasses();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
                Defina as informações básicas sobre sua prova.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Título da Prova <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={config.title}
                onChange={handleInputChange}
                placeholder="ex., Prova de Biologia"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="class"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Turma <span className="text-red-500">*</span>
              </Label>
              {!showCreateClass ? (
                <Select
                  key={`class-select-${classes.length}`}
                  value={config.class._id || ""}
                  onValueChange={handleClassChange}
                >
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => {
                      const classId = classItem.id || classItem._id;
                      return (
                        <SelectItem key={classId} value={classId}>
                          {classItem.name}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="create-new">
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="h-4 w-4" />
                        Criar Nova Turma
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da nova turma"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateClass();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleCreateClass}
                    disabled={isCreatingClass || !newClassName.trim()}
                  >
                    {isCreatingClass ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreateClass(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              id="description"
              name="description"
              value={config.description}
              onChange={handleInputChange}
              placeholder="Breve descrição do conteúdo e propósito da prova"
              rows={3}
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Style Card */}
      <Card className="hover:border-primary/20 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Estilo das Questões</CardTitle>
              <CardDescription>
                Selecione o estilo de questões para a sua prova.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={config.questionStyle}
            onValueChange={handleQuestionStyleChange}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
          >
            <ToggleGroupItem
              value="simple"
              aria-label="Toggle simple"
              className="h-auto p-6 border data-[state=on]:border-primary/20 data-[state=on]:bg-primary/5"
            >
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <div className="font-semibold text-lg">Simples</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Questões diretas com base no conteúdo.
                </div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="enem"
              aria-label="Toggle enem"
              className="h-auto p-6 border data-[state=on]:border-primary/20 data-[state=on]:bg-primary/5"
            >
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  <div className="font-semibold text-lg">ENEM</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Questões contextualizadas e densas.
                </div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="enade"
              aria-label="Toggle enade"
              className="h-auto p-6 border data-[state=on]:border-primary/20 data-[state=on]:bg-primary/5"
            >
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <div className="font-semibold text-lg">ENADE</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Questões com estudos de caso profissionais.
                </div>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
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
                Configurações das Questões
              </CardTitle>
              <CardDescription>
                Configure os tipos e número de questões.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Question Count */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Número de Questões
              </Label>
              <Badge variant="secondary" className="px-3 py-1">
                {config.questionCount} questões
              </Badge>
            </div>
            <div className="px-3">
              <Slider
                value={[config.questionCount]}
                min={1}
                max={maxQuestions}
                step={1}
                onValueChange={handleQuestionCountChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>{maxQuestions}</span>
              </div>
              {subscription?.plan === "trial" && (
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    <strong>Sem plano ativo:</strong> Máximo 10 questões por
                    prova. Faça upgrade para criar provas com até 50 questões.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Question Types */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Tipos de Questões</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="multipleChoice"
                  checked={config.questionTypes.multipleChoice}
                  onCheckedChange={(checked) =>
                    handleQuestionTypeChange(
                      "multipleChoice",
                      checked as boolean
                    )
                  }
                  disabled={config.questionStyle === "enem" || config.questionStyle === "enade"}
                />
                <Label
                  htmlFor="multipleChoice"
                  className="text-sm font-medium cursor-pointer"
                >
                  Múltipla Escolha
                </Label>
                {config.questionTypes.multipleChoice && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="trueFalse"
                  checked={config.questionTypes.trueFalse}
                  onCheckedChange={(checked) =>
                    handleQuestionTypeChange("trueFalse", checked as boolean)
                  }
                  disabled={config.questionStyle === "enem" || config.questionStyle === "enade"}
                />
                <Label
                  htmlFor="trueFalse"
                  className="text-sm font-medium cursor-pointer"
                >
                  Verdadeiro/Falso
                </Label>
                {config.questionTypes.trueFalse && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            {(config.questionStyle === "enem" || config.questionStyle === "enade") && (
              <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-muted/50 p-3 rounded-lg border border-blue-200 dark:border-muted">
                📝 No estilo {config.questionStyle === "enem" ? "ENEM" : "ENADE"}, apenas questões de múltipla escolha são
                permitidas.
              </p>
            )}
          </div>

          {/* Difficulty Level */}
          <div className="space-y-3">
            <Label htmlFor="difficulty" className="text-base font-medium">
              Nível de Dificuldade
            </Label>
            <Select
              value={config.difficulty}
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Selecione o nível de dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fácil">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Fácil
                  </div>
                </SelectItem>
                <SelectItem value="médio">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Médio
                  </div>
                </SelectItem>
                <SelectItem value="difícil">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Difícil
                  </div>
                </SelectItem>
                <SelectItem value="misto">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Misto (Vários Níveis)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Distribution - Only shown when "misto" is selected */}
          {config.difficulty === "misto" && (
            <div className="space-y-4 border border-blue-200 dark:border-muted rounded-lg p-4 bg-blue-50 dark:bg-muted/30">
              <Label className="text-base font-medium text-blue-800 dark:text-foreground">
                Distribuição de Dificuldade
              </Label>
              <p className="text-sm text-blue-600 dark:text-muted-foreground">
                Defina quantas questões de cada nível de dificuldade você
                deseja.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">
                    Fácil
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={config.questionCount}
                    value={difficultyDistribution.fácil}
                    onChange={(e) =>
                      handleDifficultyDistributionChange(
                        "fácil",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-yellow-700">
                    Médio
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={config.questionCount}
                    value={difficultyDistribution.médio}
                    onChange={(e) =>
                      handleDifficultyDistributionChange(
                        "médio",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="border-yellow-300 focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">
                    Difícil
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={config.questionCount}
                    value={difficultyDistribution.difícil}
                    onChange={(e) =>
                      handleDifficultyDistributionChange(
                        "difícil",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="border-red-300 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600 dark:text-white">
                  Total:{" "}
                  {difficultyDistribution.fácil +
                    difficultyDistribution.médio +
                    difficultyDistribution.difícil}{" "}
                  questões
                </span>
                <span className="text-blue-600 dark:text-white">
                  Máximo: {config.questionCount} questões
                </span>
              </div>

              {difficultyDistribution.fácil +
                difficultyDistribution.médio +
                difficultyDistribution.difícil >
                config.questionCount && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                  ⚠️ O total de questões não pode exceder {config.questionCount}
                </div>
              )}
            </div>
          )}

          {/* Time Limit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo Limite
              </Label>
              <Badge variant="secondary" className="px-3 py-1">
                {config.timeLimit} minutos
              </Badge>
            </div>
            <div className="px-3">
              <Slider
                value={[config.timeLimit]}
                min={15}
                max={180}
                step={5}
                onValueChange={handleTimeLimitChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15 min</span>
                <span>180 min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="gap-2 w-full sm:w-auto touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar para Upload</span>
          <span className="sm:hidden">Voltar</span>
        </Button>

        <Button
          onClick={handleReviewConfig}
          className="gap-2 w-full sm:w-auto touch-manipulation"
        >
          <span className="hidden sm:inline">Revisar Configurações</span>
          <span className="sm:hidden">Revisar</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
