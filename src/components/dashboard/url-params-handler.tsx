"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function URLParamsHandler() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const subscription = searchParams.get("subscription");
    const error = searchParams.get("error");

    if (subscription === "success") {
      toast({
        title: "Sucesso!",
        description:
          "Assinatura ativada com sucesso! Bem-vindo ao seu novo plano! 🎉",
      });
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        unauthorized: "Erro de autenticação. Por favor, faça login novamente.",
        missing_session: "Sessão de checkout inválida.",
        no_customer: "Erro ao processar o pagamento.",
        user_not_found: "Usuário não encontrado.",
        stripe_error: "Erro no processamento do pagamento.",
        processing_error: "Erro interno. Tente novamente.",
      };

      const message = errorMessages[error] || "Ocorreu um erro inesperado.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }

    // Clean up URL parameters after showing the message
    if (subscription || error) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, toast]);

  return null; // This component doesn't render anything
}
