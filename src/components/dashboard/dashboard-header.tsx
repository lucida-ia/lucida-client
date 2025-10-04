"use client";
import { ReactNode, useEffect, useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  const { isAdmin } = useSubscription();
  const [targetId, setTargetId] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("impersonateUserId");
    setImpersonating(stored || null);
  }, []);

  const handleImpersonate = () => {
    const trimmed = targetId.trim();
    if (!trimmed) return;
    localStorage.setItem("impersonateUserId", trimmed);
    setImpersonating(trimmed);
    window.location.reload();
  };

  const handleRevert = () => {
    localStorage.removeItem("impersonateUserId");
    setImpersonating(null);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="grid gap-2">
        <h1 className="text-title-2 md:text-title-1 lg:text-large-title font-bold text-foreground">
          {heading}
        </h1>
        {text && (
          <p className="text-subhead md:text-body text-muted-foreground">
            {text}
          </p>
        )}
      </div>
      <div className="flex gap-2 items-center">
        {isAdmin && (
          <div className="flex items-center gap-2 rounded-apple p-4 bg-card apple-shadow">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Input
                placeholder="Impersonate userId"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="h-8 w-56"
              />
              <Button
                size="sm"
                variant="tinted"
                onClick={handleImpersonate}
                className="h-8"
              >
                Ver usuário
              </Button>
              {impersonating && (
                <>
                  <Badge variant="secondary" className="hidden md:inline">
                    {impersonating}
                  </Badge>
                  <Button
                    variant="gray"
                    size="sm"
                    onClick={handleRevert}
                    className="h-8"
                  >
                    Voltar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        {children && <div className="flex gap-2">{children}</div>}
      </div>
    </div>
  );
}
