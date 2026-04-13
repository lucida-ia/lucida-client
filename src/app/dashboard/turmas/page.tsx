"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, Plus, Search, ChevronRight, Users } from "lucide-react";
import { fetchUnifiedOverviewData } from "@/lib/fetch-unified-overview-data";
import type { ClassData } from "@/lib/fetch-unified-overview-data";
import { useToast } from "@/hooks/use-toast";

type ClassRow = ClassData & { studentCount?: number };

export default function TurmasListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [classes, setClasses] = React.useState<ClassRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const overview = await fetchUnifiedOverviewData();
      const base = overview.classes;
      const withCounts = await Promise.all(
        base.map(async (c) => {
          try {
            const res = await axios.get(`/api/class/${c.id}`);
            if (res.data.status === "success") {
              return {
                ...c,
                studentCount: res.data.data.studentCount as number,
              };
            }
          } catch {
            /* ignore */
          }
          return { ...c, studentCount: undefined };
        })
      );
      setClasses(withCounts);
    } catch {
      toast({
        title: "Erro ao carregar turmas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, search]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardHeader
          heading="Turmas"
          text="Escolha uma turma para ver provas, alunos e resultados."
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" asChild>
            <Link href="/dashboard/overview">Todas as provas</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/dashboard/classes/create">
              <Plus className="h-4 w-4 mr-2" />
              Nova turma
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium text-foreground mb-2">
                {classes.length === 0
                  ? "Nenhuma turma ainda"
                  : "Nenhuma turma encontrada"}
              </p>
              {classes.length === 0 && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/classes/create">Criar primeira turma</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Card
                key={c.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/turmas/${c.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Folder className="h-5 w-5 text-blue-600 shrink-0" />
                      <span className="line-clamp-2">{c.name}</span>
                    </CardTitle>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {c.exams.length}{" "}
                    {c.exams.length === 1 ? "prova" : "provas"}
                  </Badge>
                  {typeof c.studentCount === "number" && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {c.studentCount}{" "}
                      {c.studentCount === 1 ? "aluno" : "alunos"}
                    </Badge>
                  )}
                  <Badge variant="outline">{c.totalResults} resultados</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
