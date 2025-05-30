import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function CreateExamCTA() {
  return (
    <Button asChild>
      <Link href="/dashboard/create">
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Exam
      </Link>
    </Button>
  );
}