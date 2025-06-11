"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function ClassTable({ studants }: { studants: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aluno</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Provas Realizadas</TableHead>
          <TableHead>Média</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studants?.map((studant) => (
          <TableRow key={studant.id}>
            <TableCell>{studant.name}</TableCell>
            <TableCell>{studant.email}</TableCell>
            <TableCell>{studant.exams?.length}</TableCell>
            <TableCell>
              {studant.exams?.reduce(
                (acc: number, curr: any) => acc + curr.result,
                0
              ) / studant.exams?.length}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
