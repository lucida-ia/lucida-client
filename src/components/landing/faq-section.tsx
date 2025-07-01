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
        "O Lucida usa inteligência artificial avançada (OpenAI GPT-4) para analisar seu conteúdo educacional e gerar questões automaticamente. O sistema processa documentos em PDF ou DOCX, extrai o texto e cria questões personalizadas baseadas no material enviado. Você pode escolher entre dois estilos: questões simples diretas ou questões no estilo ENEM com contextualização.",
    },
    {
      question: "Quais formatos de arquivo posso enviar?",
      answer:
        "O Lucida suporta arquivos PDF e DOCX (Microsoft Word) com tamanho máximo de 50MB. Você pode enviar anotações de aula, capítulos de livros, guias de estudo ou qualquer material educacional em texto. O sistema extrai automaticamente o conteúdo para gerar as questões.",
    },
    {
      question: "Posso personalizar os tipos de questões geradas?",
      answer:
        "Sim! Você pode configurar múltipla escolha e verdadeiro/falso, escolher o número de questões (1-30), definir níveis de dificuldade (fácil, médio, difícil ou misto) e estabelecer tempo limite (15-180 minutos). Para questões no estilo ENEM, o sistema gera automaticamente questões contextualizadas com 5 alternativas.",
    },
    {
      question: "Posso compartilhar as provas com meus alunos?",
      answer:
        "Sim! Cada prova gerada recebe um link único que você pode compartilhar com seus alunos. Eles podem acessar a prova online, responder as questões e receber a pontuação automaticamente. O sistema também permite organizar provas por turmas.",
    },
    {
      question: "Quão precisas são as questões geradas?",
      answer:
        "Nossa IA foi treinada especificamente para criar questões educacionais de qualidade. O sistema gera questões com distratores plausíveis e explicações para as respostas corretas. Recomendamos sempre revisar as provas antes do uso para garantir que atendam às suas necessidades específicas.",
    },
    {
      question: "Meu conteúdo está seguro quando eu o envio?",
      answer:
        "Sim, seu conteúdo está protegido. Os arquivos são processados apenas para extração de texto e geração de questões. O sistema não armazena permanentemente seus documentos e não compartilha seu conteúdo com terceiros. Todo o processamento é feito de forma segura e criptografada.",
    },
    {
      question: "Posso editar as questões após a geração?",
      answer:
        "Atualmente, o sistema gera as questões automaticamente e você pode visualizá-las antes de salvar a prova. As questões são criadas com base no conteúdo enviado e nas configurações escolhidas. Após salvar, a prova fica disponível para compartilhamento com os alunos.",
    },
    {
      question: "O sistema funciona para todas as disciplinas?",
      answer:
        "Sim! O Lucida foi desenvolvido para funcionar com qualquer disciplina ou área do conhecimento. A IA analisa o conteúdo específico do seu material e gera questões relevantes para a matéria, seja matemática, história, biologia, português ou qualquer outra disciplina.",
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
        <div className="mt-12 max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
