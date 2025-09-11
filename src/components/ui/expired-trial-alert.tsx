import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";

interface ExpiredTrialAlertProps {
  className?: string;
}

export function ExpiredTrialAlert({
  className = "mt-6",
}: ExpiredTrialAlertProps) {
  return (
    <Alert
      className={`bg-red-50 border-red-200 items-start dark:bg-red-950 dark:border-red-800 ${className}`}
    >
      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
      <AlertDescription className="text-red-600 dark:text-red-400">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong>Período de teste expirado:</strong> Sua avaliação gratuita
            de 7 dias expirou. Faça upgrade do seu plano para continuar criando
            provas e ter acesso completo à plataforma.
          </div>
          <Link href="/dashboard/billing">
            <Button
              size="sm"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Ver Planos
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
