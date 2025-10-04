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
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Zap, Shield, Gift, Copy } from "lucide-react";

interface PromoDialogProps {
  isTrialUser: boolean;
  isLoading: boolean;
}

export function PromoDialog({ isTrialUser, isLoading }: PromoDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Only show dialog if user is on trial and data is loaded
    if (!isLoading && isTrialUser) {
      // Check if dialog was already shown in this session
      const hasShownDialog = sessionStorage.getItem("promo-dialog-shown");

      if (!hasShownDialog) {
        // Small delay to let the page load first
        const timer = setTimeout(() => {
          setOpen(true);
          sessionStorage.setItem("promo-dialog-shown", "true");
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

  const handleCopyPromoCode = async () => {
    try {
      await navigator.clipboard.writeText("LUCIDAEXPLORA");
      toast({
        title: "Cupom copiado!",
        description:
          "O código LUCIDAEXPLORA foi copiado para sua área de transferência.",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = "LUCIDAEXPLORA";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      toast({
        title: "Cupom copiado!",
        description:
          "O código LUCIDAEXPLORA foi copiado para sua área de transferência.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/40 dark:bg-apple-gray-6/60" />
        <DialogContent className="w-[95vw] mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-apple-orange apple-shadow">
              <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-headline sm:text-title-3 font-bold leading-tight px-2 sm:px-0 text-foreground">
              🎉 Oferta Especial Lucida!
            </DialogTitle>
            <DialogDescription className="text-center text-subhead sm:text-body mt-2 px-2 sm:px-0 leading-relaxed text-muted-foreground">
              Experimente todos os recursos da Lucida <br />
              pagando só <strong className="text-apple-orange">
                R$ 1,99
              </strong>{" "}
              no seu primeiro mês!
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 sm:my-6 space-y-3 sm:space-y-4 px-2 sm:px-0">
            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm border-0 dark:border-0">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-200">
                  Até 10 avaliações por mês
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                  Crie muito mais avaliações para suas turmas
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100/80 dark:bg-green-900/50 backdrop-blur-sm border-0 dark:border-0">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-200">
                  Sistema anti-fraude
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                  Avaliações online seguras e confiáveis
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100/80 dark:bg-purple-900/50 backdrop-blur-sm border-0 dark:border-0">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-200">
                  Acesso prioritário
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-500 leading-relaxed">
                  Seja o primeiro a usar novas ferramentas e recursos
                </p>
              </div>
            </div>
          </div>

          <div className="mx-2 sm:mx-0 rounded-lg bg-gradient-to-r from-orange-50/80 to-pink-50/80 dark:from-gray-800/60 dark:to-gray-800/60 backdrop-blur-sm border border-orange-200/30 dark:border-gray-600/40 p-3 sm:p-4">
            <p className="text-sm sm:text-base font-medium text-orange-900 dark:text-gray-200 text-center">
              🎁 <strong>Apenas R$ 1,99 no primeiro mês</strong>
            </p>
            <p className="text-xs sm:text-sm text-orange-700 dark:text-gray-400 mt-1 leading-relaxed text-center">
              Basta utilizar o cupom na hora da assinatura. 🚀
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-white/80 dark:bg-gray-700/80 rounded-lg border border-orange-300/50 dark:border-gray-500/40">
              <code className="font-mono font-bold text-orange-900 dark:text-gray-200 text-sm sm:text-base">
                LUCIDAEXPLORA
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPromoCode}
                className="h-8 w-8 p-0 hover:bg-orange-200/70 dark:hover:bg-gray-600/50"
              >
                <Copy className="h-4 w-4 text-orange-800 dark:text-gray-300" />
              </Button>
            </div>
          </div>

          <DialogFooter className="flex justify-center items-center flex-col mt-4 px-2">
            <Button
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 dark:from-orange-600 dark:to-pink-700 dark:hover:from-orange-700 dark:hover:to-pink-800 text-sm sm:text-base py-3 sm:py-2 shadow-lg backdrop-blur-sm text-white"
              size="lg"
            >
              🎯 Aproveitar Oferta Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
