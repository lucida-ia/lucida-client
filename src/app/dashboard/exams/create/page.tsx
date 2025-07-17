"use client";

import { useState, useEffect } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateExamUpload } from "@/components/create-exam/create-exam-upload";
import { CreateExamCustomize } from "@/components/create-exam/create-exam-customize";
import { CreateExamPreview } from "@/components/create-exam/create-exam-preview";
import { CreateExamGenerated } from "@/components/create-exam/create-exam-generated";
import { useToast } from "@/hooks/use-toast";

export default function CreateExamPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [examConfig, setExamConfig] = useState({
    title: "",
    description: "",
    questionStyle: "simple" as "simple" | "enem",
    questionCount: 10,
    class: {
      _id: "",
      name: "",
    },
    questionTypes: {
      multipleChoice: true,
      trueFalse: true,
      shortAnswer: false,
      essay: false,
    },
    difficulty: "médio",
    timeLimit: 60,
  });
  const [generatedExam, setGeneratedExam] = useState<any>(null);

  const { toast } = useToast();

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setActiveTab("customize");
  };

  const handleExamConfigured = (config: any) => {
    if (!config.class) {
      toast({
        title: "Erro ao criar prova",
        description: "Selecione uma turma",
        variant: "default",
      });
      return;
    }

    if (!config.title) {
      toast({
        title: "Erro ao criar prova",
        description: "Preencha o título da prova",
        variant: "default",
      });
      return;
    }

    setExamConfig(config);
    setActiveTab("preview");
  };

  const handleExamGenerated = (exam: any) => {
    setGeneratedExam(exam);
    setActiveTab("generated");
  };

  const handleBackToUpload = () => {
    setActiveTab("upload");
  };

  const handleBackToCustomize = () => {
    setActiveTab("customize");
  };

  const handleBackToPreview = () => {
    setActiveTab("preview");
  };

  return (
    <>
      <DashboardHeader
        heading="Criar Nova Prova"
        text="Envie conteúdo, personalize configurações e gere sua prova."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger
            value="upload"
            className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2"
          >
            <span className="hidden sm:inline">1. </span>Enviar Conteúdo
          </TabsTrigger>
          <TabsTrigger
            value="customize"
            disabled={uploadedFiles.length === 0}
            className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2"
          >
            <span className="hidden sm:inline">2. </span>Personalizar
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            disabled={!examConfig.title}
            className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2"
          >
            <span className="hidden sm:inline">3. </span>Visualizar e Gerar
          </TabsTrigger>
          <TabsTrigger
            value="generated"
            disabled={!generatedExam}
            className="text-xs md:text-sm px-2 py-2 md:px-3 md:py-2"
          >
            <span className="hidden sm:inline">4. </span>Prova Gerada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <CreateExamUpload
            uploadedFiles={uploadedFiles}
            onFilesUploaded={handleFilesUploaded}
          />
        </TabsContent>

        <TabsContent value="customize">
          <CreateExamCustomize
            files={uploadedFiles}
            initialConfig={examConfig}
            onConfigured={handleExamConfigured}
            onBack={handleBackToUpload}
          />
        </TabsContent>

        <TabsContent value="preview">
          <CreateExamPreview
            files={uploadedFiles}
            config={examConfig}
            onBack={handleBackToCustomize}
            onExamGenerated={handleExamGenerated}
          />
        </TabsContent>

        <TabsContent value="generated">
          {generatedExam && (
            <CreateExamGenerated
              generatedExam={generatedExam}
              onBack={handleBackToPreview}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
