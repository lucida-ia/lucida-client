import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      "Sim, seus materiais ficam totalmente seguros e privados. Não compartilhamos seu conteúdo com terceiros, e você mantém todos os direitos sobre seus materiais. Utilizamos apenas para gerar suas provas personalizadas. Para mais detalhes, consulte nossa política de privacidade.",
  },
  {
    question: "Vocês oferecem descontos educacionais?",
    answer:
      "Sim, oferecemos preços especiais para instituições educacionais. Entre em contato com nossa equipe comercial para mais informações sobre nossas opções de licenciamento educacional e descontos por volume.",
  },
];

export function FAQSection() {
  return (
    <section
      id="faq"
      className="relative z-10 px-3 sm:px-4 lg:px-8 py-16 sm:py-32"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Perguntas Frequentes
          </h2>
          <p className="text-base sm:text-xl text-slate-400 px-4">
            Tire suas principais dúvidas
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 backdrop-blur-sm"
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={`item-${index}`} className="border-none">
                  <AccordionTrigger className="px-4 sm:px-8 py-4 sm:py-6 text-white hover:text-blue-300 text-left font-medium hover:no-underline text-sm sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 sm:px-8 pb-4 sm:pb-6 text-slate-400 leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
