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
import { isTrialUserPastOneWeek, getImpersonateUserId } from "@/lib/utils";
import { ExpiredTrialAlert } from "@/components/ui/expired-trial-alert";
import { Upload, Settings, Eye } from "lucide-react";

export default function CreateExamPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [youtubeVideoData, setYoutubeVideoData] = useState<
    Record<string, { title?: string; videoId?: string }>
  >({});
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
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const stopLoadingRef = useRef<(() => void) | null>(null);
  const hasLoggedIntegratTrueRef = useRef(false);

  const { toast } = useToast();
  const router = useRouter();

  // Fetch user data to check trial status
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true);
        const asUser = getImpersonateUserId();
        const response = await axios.get(
          "/api/user" + (asUser ? `?asUser=${encodeURIComponent(asUser)}` : ""),
        );
        setUserData(response.data.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const envIntegrationId = process.env.NEXT_PUBLIC_INTEGRAT_INTEGRATION_ID;

    const userIntegrationId = userData?.user?.integrationId;

    console.log("[INTEGRAT] envIntegrationId", envIntegrationId);
    console.log("[INTEGRAT] userIntegrationId", userIntegrationId);

    if (
      !hasLoggedIntegratTrueRef.current &&
      envIntegrationId &&
      userIntegrationId &&
      userIntegrationId === envIntegrationId
    ) {
      hasLoggedIntegratTrueRef.current = true;
    }
  }, [userData]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const handleFilesUploaded = (
    files: File[],
    youtubeUrls?: string[],
    youtubeVideoData?: Record<string, { title?: string; videoId?: string }>,
  ) => {
    setUploadedFiles(files);
    setYoutubeUrls(youtubeUrls || []);
    setYoutubeVideoData(youtubeVideoData || {});
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

  // Check if trial user is past one week and should have actions disabled
  const shouldDisableActions = userData?.user
    ? isTrialUserPastOneWeek(userData.user)
    : false;

  return (
    <>
      <DashboardHeader
        heading="Criar Nova Prova"
        text="Envie conteúdo, personalize configurações e gere sua prova."
      />

      {/* Warning banner for trial users past one week */}
      {shouldDisableActions && <ExpiredTrialAlert />}

      <Tabs
        value={activeTab}
        onValueChange={shouldDisableActions ? undefined : setActiveTab}
        className="mt-8"
      >
        <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-gray-100 dark:bg-apple-gray-6 rounded-xl border border-gray-200 dark:border-apple-gray-4">
          <TabsTrigger
            value="upload"
            disabled={shouldDisableActions}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar Conteúdo</span>
            <span className="sm:hidden">Upload</span>
          </TabsTrigger>
          <TabsTrigger
            value="customize"
            disabled={
              (uploadedFiles.length === 0 && youtubeUrls.length === 0) ||
              shouldDisableActions
            }
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Personalizar</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            disabled={!examConfig.title || shouldDisableActions}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Revisar & Gerar</span>
            <span className="sm:hidden">Revisar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-8">
          <CreateExamUpload
            uploadedFiles={uploadedFiles}
            youtubeUrls={youtubeUrls}
            youtubeVideoData={youtubeVideoData}
            onFilesUploaded={handleFilesUploaded}
            shouldDisableActions={shouldDisableActions}
          />
        </TabsContent>

        <TabsContent value="customize" className="mt-8">
          <CreateExamCustomize
            files={uploadedFiles}
            initialConfig={examConfig}
            onConfigured={handleExamConfigured}
            onBack={handleBackToUpload}
            shouldDisableActions={shouldDisableActions}
            user={userData?.user}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-8">
          <CreateExamPreview
            files={uploadedFiles}
            youtubeUrls={youtubeUrls}
            youtubeVideoData={youtubeVideoData}
            config={examConfig}
            onBack={handleBackToCustomize}
            onExamGenerated={handleExamGenerated}
            onSetStopLoadingCallback={setStopLoadingCallback}
            shouldDisableActions={shouldDisableActions}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
