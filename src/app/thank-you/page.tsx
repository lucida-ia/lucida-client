"use client";

import { Button } from "@/components/ui/button";
import LucidaLogo from "@/components/lucida-logo";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import React from "react";

export default function ThankYouPage() {
  const { user } = useUser();

  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-screen bg-apple-system-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="flex flex-col items-center gap-4 justify-center">
          <h1 className="text-title-1 font-semibold text-apple-label dark:text-apple-label-dark">
            Obrigado, {user?.firstName || user?.username}!
          </h1>
          <p className="text-body text-apple-secondary-label dark:text-apple-secondary-label-dark leading-relaxed flex items-center gap-2">
            A Lulu já está preparando seu ambiente...{" "}
            <Loader2 className="w-8 h-8 animate-spin text-apple-blue-light" />
          </p>
        </div>

        <div className="w-32 mx-auto">
          <LucidaLogo />
        </div>

        <div className="flex items-center justify-center"></div>
      </div>
    </div>
  );
}
