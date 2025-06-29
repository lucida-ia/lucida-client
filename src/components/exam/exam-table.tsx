"use client";

import { DBClass, DBExam } from "@/types/exam";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ExamShareButton } from "./exam-share-button";

import { Button } from "../ui/button";
import { TooltipTrigger } from "../ui/tooltip";
import { TooltipContent } from "../ui/tooltip";
import { Tooltip } from "../ui/tooltip";
import { Edit, FileText, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function ExamTable({
  exams,
  fetchExams,
}: {
  exams: DBExam[];
  fetchExams: () => void;
}) {
  const { toast } = useToast();

  const handleDeleteExam = async (examId: string) => {
    const response = await axios.delete("/api/exam", {
      data: { examId },
    });

    if (response.status === 200) {
      toast({
        title: "Prova deletada com sucesso",
      });
    } else {
      toast({
        title: "Falha ao deletar prova",
        description: response.data.message,
      });
    }
    fetchExams();
  };

  return (
    <>
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
          {exams?.map((exam) => (
            <TableRow key={exam?._id}>
              <TableCell className="font-medium">{exam?.title}</TableCell>
              <TableCell>{exam?.questions.length}</TableCell>
              <TableCell>
                {formatDistanceToNow(exam?.createdAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(exam?.updatedAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/dashboard/exams/${exam._id}`}>
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">Visualizar</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualizar Prova</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar Prova</TooltipContent>
                  </Tooltip>

                  {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Duplicar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar Prova</TooltipContent>
            </Tooltip> */}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExamShareButton examId={exam?._id} />
                    </TooltipTrigger>
                    <TooltipContent>Compartilhar Prova</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteExam(exam?._id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir Prova</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
