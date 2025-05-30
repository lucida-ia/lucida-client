"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Trash, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/components/auth-provider";

export function RecentExams() {
  const { user } = useAuth();
  
  // Mock data - would come from an API in a real application
  const [exams, setExams] = useState([
    {
      id: "1",
      title: "Biology Midterm",
      questionsCount: 35,
      createdAt: new Date(2025, 3, 10),
      updatedAt: new Date(2025, 3, 15),
    },
    {
      id: "2",
      title: "Introduction to Psychology",
      questionsCount: 42,
      createdAt: new Date(2025, 3, 5),
      updatedAt: new Date(2025, 3, 5),
    },
    {
      id: "3",
      title: "World History Final",
      questionsCount: 50,
      createdAt: new Date(2025, 2, 28),
      updatedAt: new Date(2025, 3, 1),
    },
    {
      id: "4",
      title: "Calculus Quiz",
      questionsCount: 20,
      createdAt: new Date(2025, 2, 20),
      updatedAt: new Date(2025, 2, 20),
    },
  ]);

  // Mock function to delete an exam
  const handleDelete = (id: string) => {
    setExams(exams.filter(exam => exam.id !== id));
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Exams</CardTitle>
        <CardDescription>
          You have created {exams.length} exams in total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exams.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Title</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.questionsCount}</TableCell>
                  <TableCell>{formatDistanceToNow(exam.createdAt, { addSuffix: true })}</TableCell>
                  <TableCell>{formatDistanceToNow(exam.updatedAt, { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicate</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(exam.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
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
              <h3 className="font-semibold">No exams created yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first exam to get started.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}