"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield } from "lucide-react";

interface TrialUpgradeDialogProps {
  isTrialUser: boolean;
  isLoading: boolean;
}

export function TrialUpgradeDialog({
  isTrialUser,
  isLoading,
}: TrialUpgradeDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only show dialog if user is on trial and data is loaded
    if (!isLoading && isTrialUser) {
      // Check if dialog was already shown in this session
      const hasShownDialog = sessionStorage.getItem(
        "trial-upgrade-dialog-shown"
      );

      if (!hasShownDialog) {
        // Small delay to let the page load first
        const timer = setTimeout(() => {
          setOpen(true);
          sessionStorage.setItem("trial-upgrade-dialog-shown", "true");
        }, 1500);

        return () => clearTimeout(timer);
      }
    }
  }, [isTrialUser, isLoading]);

  const handleUpgradeClick = () => {
    setOpen(false);
    router.push("/dashboard/billing");
  };

  const handleNotNow = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/30" />
        <DialogContent className="w-[95vw] mx-auto backdrop-blur-md bg-white/95 dark:bg-apple-secondary-grouped-background/95 border border-white/20 dark:border-apple-gray-4/30 shadow-2xl rounded-lg">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-lg sm:text-xl font-bold leading-tight px-2 sm:px-0">
              🚀 Desbloqueie todo o potencial do Lucida!
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base mt-2 px-2 sm:px-0 leading-relaxed">
              Você está usando a versão gratuita. Upgrade para{" "}
              <strong>Pro</strong> e transforme completamente sua forma de criar
              avaliações!
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 sm:my-6 space-y-3 sm:space-y-4 px-2 sm:px-0">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base">
                  Até 10 avaliações por mês
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Crie muito mais avaliações para suas turmas
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base">
                  Sistema anti-fraude
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Avaliações online seguras e confiáveis
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100/80 dark:bg-purple-900/30 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base">
                  Acesso prioritário
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Seja o primeiro a usar novas ferramentas e recursos
                </p>
              </div>
            </div>
          </div>

          <div className="mx-2 sm:mx-0 rounded-lg bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 p-3 sm:p-4 text-center">
            <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">
              💸 <strong>Comece por apenas R$ 35/mês</strong>
            </p>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
              Cancele quando quiser • Suporte dedicado • Sem compromisso
            </p>
          </div>

          <DialogFooter className="flex justify-center items-center flex-col mt-4 px-2">
            <Button
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-sm sm:text-base py-3 sm:py-2 shadow-lg backdrop-blur-sm"
              size="lg"
            >
              🎯 Fazer Upgrade para Pro Agora
            </Button>
            <Button
              variant="ghost"
              onClick={handleNotNow}
              className="w-full text-sm py-2 min-h-[44px] backdrop-blur-sm hover:bg-white/10 dark:hover:bg-gray-800/30"
              size="sm"
            >
              Talvez mais tarde
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
