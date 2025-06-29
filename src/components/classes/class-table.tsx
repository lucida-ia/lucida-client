"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { format } from "date-fns";

export function ClassTable({ results }: { results: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prova</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Nota</TableHead>
          <TableHead>Percentual</TableHead>
          <TableHead>Data da Prova</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results?.map((result) => (
          <TableRow key={result._id}>
            <TableCell>{result.examTitle}</TableCell>
            <TableCell>{result.email}</TableCell>
            <TableCell>
              {result.score}/{result.examQuestionCount}
            </TableCell>
            <TableCell>{result.percentage * 100}%</TableCell>
            <TableCell>{format(result.createdAt, "dd/MM/yyyy")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
