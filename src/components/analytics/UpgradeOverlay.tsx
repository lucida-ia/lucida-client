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

export function UpgradeOverlay({
  isBlocked,
  children,
  className,
}: UpgradeOverlayProps) {
  const router = useRouter();

  return (
    <div className={"relative " + (className || "")}>
      {/* Content always rendered so layout stays intact */}
      {children}

      {isBlocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          {/* Fade layer to dim underlying content and block interactions */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto" />

          {/* CTA card */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card card-elevation-3 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-title-2 font-semibold mb-2">Recurso Pro</h3>
            <p className="text-subhead text-secondary-label mb-6">
              Os gráficos e estatísticas de analytics estão disponíveis no plano{" "}
              <strong className="text-label">Pro</strong>.
            </p>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-footnote text-label">
                Desbloqueie relatórios completos, distribuição de notas e
                insights detalhados da turma.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
              onClick={() => router.push("/dashboard/billing")}
            >
              Fazer upgrade para Pro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpgradeOverlay;
