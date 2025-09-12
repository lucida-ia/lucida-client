import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { isTrialUserPastOneWeek } from "@/lib/utils";

interface CreateExamCTAProps {
  userData?: any;
}

export function CreateExamCTA({ userData }: CreateExamCTAProps) {
  const shouldDisableActions = userData?.user
    ? isTrialUserPastOneWeek(userData.user)
    : false;

  if (shouldDisableActions) {
    return (
      <Button disabled>
        <PlusCircle className="mr-2 h-4 w-4" />
        Criar Prova
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link
        href="/dashboard/exams/create"
        className="flex items-center justify-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        <span className="hidden sm:block m-0 p-0">Criar Prova</span>
      </Link>
    </Button>
  );
}
