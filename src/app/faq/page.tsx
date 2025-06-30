"use client";

import { NavBar } from "@/components/layout/navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  const { isSignedIn, user } = useUser();

  if (user) {
    redirect("/dashboard");
  }

  const faqs = [
    {
      question: "Como funciona a geração de provas com IA?",
      answer:
        "Nossa IA analisa seu conteúdo enviado, identifica conceitos-chave e objetivos de aprendizado, e então gera questões relevantes em diferentes níveis cognitivos. O sistema usa processamento de linguagem natural para entender o contexto e criar avaliações significativas que refletem com precisão seu material.",
    },
    {
      question: "Quais formatos de arquivo posso enviar?",
      answer:
        "O Lucida suporta vários formatos de arquivo, incluindo PDF, DOC/DOCX (Microsoft Word), TXT e RTF. Você pode enviar anotações de aula, capítulos de livros, guias de estudo ou qualquer outro material de aprendizado baseado em texto.",
    },
    {
      question: "Posso personalizar os tipos de questões geradas?",
      answer:
        "Absolutamente! Você pode especificar os tipos de questões (múltipla escolha, verdadeiro/falso, resposta curta, dissertativa), níveis de dificuldade e até mesmo a distribuição de questões entre diferentes tópicos ou objetivos de aprendizado.",
    },
    {
      question: "Quão precisas são as questões geradas?",
      answer:
        "Nossa IA foi treinada com conteúdo educacional de diversas disciplinas e produz questões de alta qualidade. No entanto, sempre recomendamos revisar as provas geradas antes do uso. O sistema melhora com o tempo conforme você fornece feedback sobre a qualidade das questões.",
    },
    {
      question: "Posso editar as questões geradas?",
      answer:
        "Sim, todas as questões geradas podem ser editadas, substituídas ou removidas. Você tem controle total sobre o conteúdo final da prova. Nosso editor facilita o refinamento de questões e respostas conforme necessário.",
    },
    {
      question: "Meu conteúdo está seguro quando eu o envio?",
      answer:
        "Levamos a segurança dos dados muito a sério. Todo o conteúdo enviado é criptografado em trânsito e em repouso. Não compartilhamos seus materiais com terceiros, e você mantém todos os direitos sobre seu conteúdo. Para detalhes, consulte nossa política de privacidade.",
    },
    {
      question: "Vocês oferecem descontos educacionais?",
      answer:
        "Sim, oferecemos preços especiais para instituições educacionais. Entre em contato com nossa equipe comercial para mais informações sobre nossas opções de licenciamento educacional e descontos por volume.",
    },
  ];

  return (
    <div className="flex flex-col w-full px-16 py-8 h-screen relative bg-black">
      <NavBar />
      <div className="absolute top-80 left-40 w-[400px] h-[400px] bg-yellow-900 rounded-full mix-blend-screen filter blur-3xl opacity-80 animate-blob"></div>
      <div className="absolute top-20 right-30 w-[400px] h-[400px] bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000 "></div>
      <div className="absolute bottom-10 right-10 w-[600px] h-[500px] bg-green-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000 "></div>
      <div className="flex flex-col w-full h-full rounded-3xl justify-center items-center gap-4">
        <div className="mx-auto w-1/2 mt-8">
          <Accordion
            type="single"
            collapsible
            className="w-full dark text-white"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                className="dark"
                key={index}
                value={`item-${index}`}
              >
                <AccordionTrigger className="text-left dark">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="dark">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
