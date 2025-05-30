"use client";

import { useState } from "react";
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
  const { toast } = useToast();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please provide a title for your exam.",
      });
      return;
    }

    const hasQuestionType = Object.values(config.questionTypes).some(
      (value) => value
    );
    if (!hasQuestionType) {
      toast({
        variant: "destructive",
        title: "Question type required",
        description: "Please select at least one question type.",
      });
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>
            Set the basic information about your exam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Exam Title</Label>
            <Input
              id="title"
              name="title"
              value={config.title}
              onChange={handleInputChange}
              placeholder="e.g., Biology Midterm Exam"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              value={config.description}
              onChange={handleInputChange}
              placeholder="Brief description of the exam content and purpose"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Settings</CardTitle>
          <CardDescription>
            Configure the types and number of questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Number of Questions: {config.questionCount}</Label>
            <Slider
              value={[config.questionCount]}
              min={1}
              max={30}
              step={1}
              onValueChange={handleQuestionCountChange}
            />
          </div>

          <div className="space-y-4">
            <Label>Question Types</Label>
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
                />
                <Label htmlFor="multipleChoice">Multiple Choice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trueFalse"
                  checked={config.questionTypes.trueFalse}
                  onCheckedChange={(checked) =>
                    handleQuestionTypeChange("trueFalse", checked as boolean)
                  }
                />
                <Label htmlFor="trueFalse">True/False</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={config.difficulty}
              onValueChange={handleDifficultyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="mixed">Mixed (Various Levels)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Time Limit: {config.timeLimit} minutes</Label>
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
          Back to Upload
        </Button>

        <Button onClick={() => onConfigured(config)}>Preview Exam</Button>
      </div>
    </form>
  );
}
