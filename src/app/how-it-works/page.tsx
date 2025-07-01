"use client";

import { NavBar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function HowItWorksPage() {
  const { isSignedIn, user } = useUser();

  if (user) {
    redirect("/dashboard");
  }

  // Placeholder steps - replace with real content as needed
  const steps = [
    {
      title: "1. Envie seu material",
      description:
        "Faça upload de arquivos PDF ou DOCX com o conteúdo que deseja transformar em prova.",
    },
    {
      title: "2. Personalize a prova",
      description:
        "Escolha o número de questões, formato (simples ou ENEM), nível de dificuldade e tipos de questões.",
    },
    {
      title: "3. Gere e revise",
      description:
        "A IA gera as questões automaticamente. Revise, ajuste se necessário e salve sua prova.",
    },
    {
      title: "4. Compartilhe ou aplique",
      description:
        "Compartilhe o link da prova com seus alunos ou aplique diretamente pela plataforma.",
    },
  ];

  return (
    <div className="flex flex-col w-full px-16 py-8 h-screen relative bg-black">
      <NavBar />
      <div className="absolute top-80 left-40 w-[400px] h-[400px] bg-yellow-900 rounded-full mix-blend-screen filter blur-3xl opacity-80 animate-blob"></div>
      <div className="absolute top-20 right-30 w-[400px] h-[400px] bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000 "></div>
      <div className="absolute bottom-10 right-10 w-[600px] h-[500px] bg-green-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000 "></div>
      <div className="flex flex-col w-full h-full rounded-3xl justify-center items-center gap-4">
        <div className="mx-auto w-1/2 mt-8 text-white">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-8 text-center text-white">
            Como Funciona o Lucida
          </h2>
          <ol className="space-y-8">
            {steps.map((step, idx) => (
              <li key={idx} className="flex flex-col gap-2 bg-white/5 rounded-xl p-6 border border-white/10 shadow">
                <span className="text-xl font-semibold text-primary">{step.title}</span>
                <span className="text-base text-white/90">{step.description}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
} 