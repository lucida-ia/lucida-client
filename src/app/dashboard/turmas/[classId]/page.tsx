"use client";

import { useParams } from "next/navigation";
import { TurmaHubClient } from "./turma-hub-client";

export default function TurmaHubPage() {
  const params = useParams();
  const classId = typeof params?.classId === "string" ? params.classId : "";
  if (!classId) return null;
  return <TurmaHubClient classId={classId} />;
}
