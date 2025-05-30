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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Edit, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
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
}

export function CreateExamPreview({
  files,
  config,
  onBack,
}: CreateExamPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [examGenerated, setExamGenerated] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<any>(null);
  const { toast } = useToast();

  const handleUploadFilesAndGenerateQuestions = async (files: File[]) => {
    try {
      setIsGenerating(true);
      const formData = new FormData();

      for (const file of files) {
        formData.append("file", file);
      }

      formData.append("config", JSON.stringify(config));

      const response = await axios("/api/upload", {
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Error",
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
              title: `Error processing ${error.fileName}`,
              description: error.error,
            });
          });
        }
        const successfulResults = data.results.filter(
          (result: any) => result.questions
        );
        if (successfulResults.length > 0) {
          console.log("Generated questions:", successfulResults);
        }
      }
      setIsGenerating(false);
      setExamGenerated(true);
      setGeneratedExam(data);
    } catch (error) {
      setIsGenerating(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the files. Please try again.",
      });
    }
  };

  console.log("generatedExam", generatedExam);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam Preview</CardTitle>
          <CardDescription>
            Review your exam configuration before generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Exam Details</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Title
                  </dt>
                  <dd className="mt-1">{config.title}</dd>
                </div>
                {config.description && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Description
                    </dt>
                    <dd className="mt-1">{config.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Time Limit
                  </dt>
                  <dd className="mt-1 flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {config.timeLimit} minutes
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Difficulty
                  </dt>
                  <dd className="mt-1 capitalize">{config.difficulty}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Question Configuration</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Total Questions
                  </dt>
                  <dd className="mt-1">{config.questionCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Question Types
                  </dt>
                  <dd className="mt-1">
                    {Object.entries(config.questionTypes)
                      .filter(([_, enabled]) => enabled)
                      .map(([type]) => type)
                      .map((type) =>
                        type
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                      )
                      .join(", ")}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Source Materials</h3>
              <ul className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <FileText className="mr-2 h-4 w-4" />
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back to Customize
          </Button>
          {examGenerated ? (
            <Button asChild>
              <Link href="/dashboard/exams">View All Exams</Link>
            </Button>
          ) : (
            <Button
              onClick={() => handleUploadFilesAndGenerateQuestions(files)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Exam...
                </>
              ) : (
                "Generate Exam"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {examGenerated && generatedExam && (
        <Card>
          <CardHeader>
            <CardTitle>{generatedExam.config.title}</CardTitle>
            <CardDescription className="flex flex-col gap-1 ">
              <span>{generatedExam.config.description}</span>
              <div className="flex items-center gap-2">
                <span>{generatedExam.config.timeLimit} minutes</span>
                <span>{generatedExam.config.difficulty}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="exam">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="exam">Exam Preview</TabsTrigger>
                <TabsTrigger value="answers">Answer Key</TabsTrigger>
              </TabsList>
              <TabsContent value="exam" className="space-y-4 mt-4">
                <div className="rounded-md border p-4">
                  <div className="mt-6 space-y-6">
                    {generatedExam.questions.map(
                      (question: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <h3 className="font-medium">
                            {index + 1}. {question.question}
                          </h3>

                          <div className="ml-6 space-y-1">
                            {question.options.map((option: any) => (
                              <div
                                key={option.id}
                                className="flex items-center space-x-2"
                              >
                                <div className="h-4 w-4 rounded-full border border-primary"></div>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="answers" className="space-y-4 mt-4">
                <div className="rounded-md border p-4">
                  <h2 className="text-xl font-bold">
                    Answer Key: {generatedExam.config.title}
                  </h2>
                  <div className="mt-6 space-y-4">
                    {generatedExam.questions.map(
                      (question: any, index: number) => (
                        <div key={index} className="space-y-1">
                          <h3 className="font-medium">
                            {index + 1}. {question.question}
                          </h3>
                          <div className="ml-6">
                            <span className="text-sm font-medium">
                              Answer:{" "}
                            </span>
                            <span>{question.correctAnswer}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Questions
            </Button>

            <Button asChild>
              <Link href={`/dashboard/exams/${generatedExam.id}`}>
                <Download className="mr-2 h-4 w-4" />
                Save Exam
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
