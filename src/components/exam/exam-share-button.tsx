"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface ExamShareButtonProps {
  examId: string;
}

export function ExamShareButton({ examId }: ExamShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/exam/share", { examId });

      const shareUrl = `${window.location.origin}/exam/${response.data.id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Share link copied!",
        description: "The exam link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate share link",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      disabled={isLoading}
      size="icon"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
