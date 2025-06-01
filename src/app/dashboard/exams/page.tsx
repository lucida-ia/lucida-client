"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { formatDistanceToNow } from "date-fns";
import { TableCell } from "@/components/ui/table";
import { TableBody } from "@/components/ui/table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table } from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { Copy, Trash } from "lucide-react";
import { Edit } from "lucide-react";
import { FileText } from "lucide-react";
import React from "react";
import axios from "axios";
import { DBExam, Exam } from "@/types/exam";
import { Button } from "@/components/ui/button";

export default function ListExamsPage() {
  const [exams, setExams] = React.useState<DBExam[]>([]);

  React.useEffect(() => {
    const fetchExams = async () => {
      const response = await axios.get("/api/exam/all");
      setExams(response.data.exams.exams);
    };
    fetchExams();
  }, []);

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Minhas Provas"
        text="Gerencie suas provas e acompanhe o desempenho dos seus alunos."
      />

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Provas Recentes</CardTitle>
          <CardDescription>
            Você criou {exams.length} provas no total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título da Prova</TableHead>
                  <TableHead>Questões</TableHead>
                  <TableHead>Criada</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>{exam.questions.length}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(exam.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(exam.updatedAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon">
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Visualizar</span>
                        </Button>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="outline" size="icon">
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Duplicar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => console.log(exam._id)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-1 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold">Nenhuma prova criada ainda</h3>
                <p className="text-sm text-muted-foreground">
                  Crie sua primeira prova para começar.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
