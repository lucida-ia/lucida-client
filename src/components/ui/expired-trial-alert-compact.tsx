import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface ExpiredTrialAlertCompactProps {
  className?: string;
}

export function ExpiredTrialAlertCompact({
  className = "mt-2 p-3 bg-apple-red/10 dark:bg-apple-red/20 border border-apple-red/30 dark:border-apple-red/40 rounded-apple",
}: ExpiredTrialAlertCompactProps) {
  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-footnote text-apple-red dark:text-apple-red">
          <strong>Período de teste expirado:</strong> Sua avaliação gratuita de
          7 dias expirou. Faça upgrade do seu plano para continuar criando
          provas.
        </p>
        <Link href="/dashboard/billing">
          <Button
            size="sm"
            variant="destructive"
            className="font-semibold text-footnote px-3 py-1.5 h-auto self-start sm:self-auto"
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            Ver Planos
          </Button>
        </Link>
      </div>
    </div>
  );
}
