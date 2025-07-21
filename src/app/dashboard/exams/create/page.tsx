"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateExamUpload } from "@/components/create-exam/create-exam-upload";
import { CreateExamCustomize } from "@/components/create-exam/create-exam-customize";
import { CreateExamPreview } from "@/components/create-exam/create-exam-preview";
import { useToast } from "@/hooks/use-toast";

export default function CreateExamPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [examConfig, setExamConfig] = useState({
    title: "",
    description: "",
    questionStyle: "simple" as "simple" | "enem" | "enade",
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
  const [isSavingExam, setIsSavingExam] = useState(false);
  const stopLoadingRef = useRef<(() => void) | null>(null);

  const { toast } = useToast();
  const router = useRouter();

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

  const handleExamGenerated = async (exam: any) => {
    setIsSavingExam(true);

    try {
      const response = await axios.post("/api/exam", exam);

      if (response.data.status === "success") {
        toast({
          title: "Prova criada com sucesso!",
          description: "Redirecionando para a página da prova...",
        });

        // Stop the loading state in the preview component
        if (stopLoadingRef.current) {
          stopLoadingRef.current();
        }

        // Redirect to the exam details page
        router.push(`/dashboard/exams/${response.data.exam._id}`);
      }
    } catch (error: any) {
      // Stop the loading state in case of error
      if (stopLoadingRef.current) {
        stopLoadingRef.current();
      }

      if (
        error.response?.status === 402 &&
        error.response?.data?.code === "USAGE_LIMIT_REACHED"
      ) {
        toast({
          title: "Limite de Provas Atingido",
          description:
            "Você atingiu o limite de provas do seu plano. Faça upgrade para criar mais provas.",
          variant: "destructive",
        });
        // Redirect to billing page after a short delay
        setTimeout(() => {
          router.push("/dashboard/billing");
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao salvar a prova. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleBackToUpload = () => {
    setActiveTab("upload");
  };

  const handleBackToCustomize = () => {
    setActiveTab("customize");
  };

  const setStopLoadingCallback = (callback: () => void) => {
    stopLoadingRef.current = callback;
  };

  return (
    <>
      <DashboardHeader
        heading="Criar Nova Prova"
        text="Envie conteúdo, personalize configurações e gere sua prova."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
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
            onSetStopLoadingCallback={setStopLoadingCallback}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
