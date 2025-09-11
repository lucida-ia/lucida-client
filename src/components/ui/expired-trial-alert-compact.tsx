import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface ExpiredTrialAlertCompactProps {
  className?: string;
}

export function ExpiredTrialAlertCompact({
  className = "mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md",
}: ExpiredTrialAlertCompactProps) {
  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-red-600 dark:text-red-400">
          <strong>Período de teste expirado:</strong> Sua avaliação gratuita de
          7 dias expirou. Faça upgrade do seu plano para continuar criando
          provas.
        </p>
        <Link href="/dashboard/billing">
          <Button
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-xs px-3 py-1.5 h-auto self-start sm:self-auto"
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            Ver Planos
          </Button>
        </Link>
      </div>
    </div>
  );
}
