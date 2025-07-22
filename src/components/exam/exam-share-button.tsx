"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { ExamSecurityConfigModal } from "./exam-security-config-modal";

interface ExamShareButtonProps {
  examId: string;
}

export function ExamShareButton({ examId }: ExamShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShare = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button variant="outline" onClick={handleShare} size="icon">
        <Share2 className="h-4 w-4" />
      </Button>

      <ExamSecurityConfigModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        examId={examId}
      />
    </>
  );
}
