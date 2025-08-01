"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClassesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/dashboard/overview");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para Minhas Avaliações...</p>
      </div>
    </div>
  );
}