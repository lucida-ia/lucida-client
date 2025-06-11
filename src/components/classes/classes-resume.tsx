"use client";

import { Button } from "../ui/button";
import { Pencil, Trash } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { ClassTable } from "./class-table";

import axios from "axios";
import React from "react";
import { useToast } from "@/hooks/use-toast";

type Class = {
  _id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  studants: Studant[];
};

type Studant = {
  _id: string;
  name: string;
  email: string;
};

export function ClassesResume() {
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const { toast } = useToast();

  const fetchClasses = async () => {
    setIsLoading(true);
    const response = await axios.get("/api/class");
    setClasses(response.data.data);
    setIsLoading(false);
  };

  const handleDeleteClass = async (id: string) => {
    setIsLoading(true);
    const response = await axios.delete("/api/class", {
      data: {
        id,
      },
    });

    if (response.status === 200) {
      fetchClasses();
    } else {
      toast({
        title: "Erro ao deletar turma",
        description: response.data.message,
        variant: "default",
      });
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div>
      <Accordion type="single" collapsible>
        {classes?.map((classItem) => (
          <AccordionItem key={classItem._id} value={classItem._id.toString()}>
            <AccordionTrigger>
              <div className="flex items-center gap-2 justify-between w-full pr-4">
                <span>{classItem.name}</span>
                <div className="flex items-center gap-2"></div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="flex items-center gap-2 justify-between w-full pr-4">
                <div className="flex items-center gap-2 w-full justify-end mb-4">
                  <Button variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    <span>Editar Turma</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleDeleteClass(classItem._id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                    <span>Deletar Turma</span>
                  </Button>
                </div>
              </div>
              <ClassTable studants={classItem.studants || []} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
