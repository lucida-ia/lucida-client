"use client";

import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateExamUpload } from "@/components/create-exam/create-exam-upload";
import { CreateExamCustomize } from "@/components/create-exam/create-exam-customize";
import { CreateExamPreview } from "@/components/create-exam/create-exam-preview";

export default function CreateExamPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [examConfig, setExamConfig] = useState({
    title: "",
    description: "",
    questionCount: 20,
    questionTypes: {
      multipleChoice: true,
      trueFalse: true,
      shortAnswer: false,
      essay: false,
    },
    difficulty: "mixed",
    timeLimit: 60,
  });

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setActiveTab("customize");
  };

  const handleExamConfigured = (config: any) => {
    setExamConfig(config);
    setActiveTab("preview");
  };

  const handleBackToUpload = () => {
    setActiveTab("upload");
  };

  const handleBackToCustomize = () => {
    setActiveTab("customize");
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create New Exam"
        text="Upload content, customize settings, and generate your exam."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">1. Upload Content</TabsTrigger>
          <TabsTrigger value="customize" disabled={uploadedFiles.length === 0}>
            2. Customize
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!examConfig.title}>
            3. Preview & Generate
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
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
