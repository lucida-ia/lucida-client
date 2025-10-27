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
      className={`bg-apple-red/10 border-apple-red/30 items-start dark:bg-apple-red/20 dark:border-apple-red/40 rounded-apple ${className}`}
    >
      <AlertTriangle className="h-4 w-4 text-apple-red mt-0.5 flex-shrink-0" />
      <AlertDescription className="text-apple-red dark:text-apple-red">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong>Período de teste expirado:</strong> Sua avaliação gratuita
            de 7 dias expirou. Faça upgrade do seu plano para continuar criando
            provas e ter acesso completo à plataforma.
          </div>
          <Link href="/dashboard/billing">
            <Button
              size="sm"
              variant="destructive"
              className="font-semibold self-start sm:self-auto text-white"
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
