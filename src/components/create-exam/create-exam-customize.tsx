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
import axios from "axios";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ExamConfig {
  title: string;
  description: string;
  questionStyle: "simples" | "enem";
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
  const { toast } = useToast();

  useEffect(() => {
    if (config.questionStyle === "enem") {
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
    setConfig((prev) => ({ ...prev, questionCount: value[0] }));
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
    setConfig((prev) => ({ ...prev, difficulty: value }));
  };

  const handleClassChange = (value: string) => {
    setConfig((prev) => ({ ...prev, class: { _id: value, name: value } }));
  };

  const handleQuestionStyleChange = (value: "simples" | "enem") => {
    if (value) {
      setConfig((prev) => ({ ...prev, questionStyle: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.title.trim()) {
      toast({
        variant: "destructive",
        title: "Título obrigatório",
        description: "Por favor, forneça um título para sua prova.",
      });
      return;
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
      return;
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Prova</CardTitle>
          <CardDescription>
            Defina as informações básicas sobre sua prova.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Prova</Label>
            <Input
              id="title"
              name="title"
              value={config.title}
              onChange={handleInputChange}
              placeholder="ex., Prova de Biologia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              name="description"
              value={config.description}
              onChange={handleInputChange}
              placeholder="Breve descrição do conteúdo e propósito da prova"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Turma</Label>
            <Select value={config.class._id} onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estilo das Questões</CardTitle>
          <CardDescription>
            Selecione o estilo de questões para a sua prova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={config.questionStyle}
            onValueChange={handleQuestionStyleChange}
            className="grid grid-cols-2"
          >
            <ToggleGroupItem value="simples" aria-label="Toggle simples">
              <div className="text-left">
                <div className="font-semibold">Simples</div>
                <div className="text-xs text-muted-foreground">
                  Questões diretas com base no conteúdo.
                </div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value="enem" aria-label="Toggle enem">
              <div className="text-left">
                <div className="font-semibold">ENEM</div>
                <div className="text-xs text-muted-foreground">
                  Questões contextualizadas e densas.
                </div>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações das Questões</CardTitle>
          <CardDescription>
            Configure os tipos e número de questões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Número de Questões: {config.questionCount}</Label>
            <Slider
              value={[config.questionCount]}
              min={1}
              max={30}
              step={1}
              onValueChange={handleQuestionCountChange}
            />
          </div>

          <div className="space-y-4">
            <Label>Tipos de Questões</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multipleChoice"
                  checked={config.questionTypes.multipleChoice}
                  onCheckedChange={(checked) =>
                    handleQuestionTypeChange(
                      "multipleChoice",
                      checked as boolean
                    )
                  }
                  disabled={config.questionStyle === "enem"}
                />
                <Label htmlFor="multipleChoice">Múltipla Escolha</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trueFalse"
                  checked={config.questionTypes.trueFalse}
                  onCheckedChange={(checked) =>
                    handleQuestionTypeChange("trueFalse", checked as boolean)
                  }
                  disabled={config.questionStyle === "enem"}
                />
                <Label htmlFor="trueFalse">Verdadeiro/Falso</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Nível de Dificuldade</Label>
            <Select
              value={config.difficulty}
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
                <SelectItem value="mixed">Misto (Vários Níveis)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Tempo Limite: {config.timeLimit} minutos</Label>
            <Slider
              value={[config.timeLimit]}
              min={15}
              max={180}
              step={5}
              onValueChange={handleTimeLimitChange}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar para Upload
        </Button>

        <Button onClick={() => onConfigured(config)}>
          Revisar Configurações
        </Button>
      </div>
    </form>
  );
}
