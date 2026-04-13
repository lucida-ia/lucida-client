"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface DashboardPendingAlertProps {
  count: number;
}

export function DashboardPendingAlert({ count }: DashboardPendingAlertProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <Alert className="border-amber-500/40 bg-amber-500/5">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle>Correções aguardando revisão</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Existem{" "}
          <strong>
            {count} {count === 1 ? "submissão" : "submissões"}
          </strong>{" "}
          que precisam de correção manual ou revisão.
        </span>
        <Button size="sm" variant="outline" asChild className="shrink-0 w-fit">
          <Link href="/dashboard/corrigir">Ir corrigir</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
