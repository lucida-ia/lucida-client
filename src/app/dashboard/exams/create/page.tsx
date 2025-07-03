"use client";

import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
    questionStyle: "simples" as "simples" | "enem",
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
    difficulty: "mixed",
    timeLimit: 60,
  });
  const [generatedExam, setGeneratedExam] = useState<any>(null);

  const { toast } = useToast();

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
    <DashboardShell>
      <DashboardHeader
        heading="Criar Nova Prova"
        text="Envie conteúdo, personalize configurações e gere sua prova."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">1. Enviar Conteúdo</TabsTrigger>
          <TabsTrigger value="customize" disabled={uploadedFiles.length === 0}>
            2. Personalizar
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!examConfig.title}>
            3. Visualizar e Gerar
          </TabsTrigger>
          <TabsTrigger value="generated" disabled={!generatedExam}>
            4. Prova Gerada
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
    </DashboardShell>
  );
}
