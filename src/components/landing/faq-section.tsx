import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
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
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Perguntas Frequentes
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Encontre respostas para perguntas comuns sobre o Lucida.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
