"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type UpgradeOverlayProps = {
  isBlocked: boolean;
  children: React.ReactNode;
  className?: string;
};

export function UpgradeOverlay({ isBlocked, children, className }: UpgradeOverlayProps) {
  const router = useRouter();

  return (
    <div className={"relative " + (className || "")}>{
      /* Content always rendered so layout stays intact */
    }
      {children}

      {isBlocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          {/* Fade layer to dim underlying content and block interactions */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] pointer-events-auto" />

          {/* CTA card */}
          <div className="relative z-10 mx-3 w-full max-w-[560px] rounded-xl border bg-white/95 shadow-2xl ring-1 ring-black/5 dark:bg-gray-900/95 p-4 sm:p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg">Recurso Pro</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Os gráficos e estatísticas de analytics estão disponíveis no plano <strong>Pro</strong>.
            </p>
            <div className="mt-3 grid gap-2 text-left text-xs sm:text-sm">
              <div className="rounded-md bg-blue-50/70 dark:bg-blue-900/20 p-2">
                Desbloqueie relatórios completos, distribuição de notas e insights da turma.
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                onClick={() => router.push("/dashboard/billing")}
              >
                Fazer upgrade para Pro
              </Button>
              <Button variant="ghost" onClick={() => router.push("/dashboard/help")}>Saiba mais</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpgradeOverlay;


