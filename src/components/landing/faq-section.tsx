import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  const faqs = [
    {
      question: "How does the AI exam generation work?",
      answer:
        "Our AI analyzes your uploaded content, identifies key concepts and learning objectives, and then generates relevant questions at different cognitive levels. The system uses natural language processing to understand context and create meaningful assessments that accurately reflect your material.",
    },
    {
      question: "What file formats can I upload?",
      answer:
        "Lucida supports various file formats including PDF, DOC/DOCX (Microsoft Word), TXT, and RTF. You can upload lecture notes, textbook chapters, study guides, or any other text-based learning material.",
    },
    {
      question: "Can I customize the types of questions generated?",
      answer:
        "Absolutely! You can specify the types of questions (multiple choice, true/false, short answer, essay), difficulty levels, and even the distribution of questions across different topics or learning objectives.",
    },
    {
      question: "How accurate are the generated questions?",
      answer:
        "Our AI has been trained on educational content across numerous disciplines and produces high-quality questions. However, we always recommend reviewing the generated exams before use. The system improves over time as you provide feedback on question quality.",
    },
    {
      question: "Can I edit the generated questions?",
      answer:
        "Yes, all generated questions can be edited, replaced, or removed. You have complete control over the final exam content. Our editor makes it easy to refine questions and answers as needed.",
    },
    {
      question: "Is my content secure when I upload it?",
      answer:
        "We take data security seriously. All uploaded content is encrypted in transit and at rest. We do not share your materials with third parties, and you retain all rights to your content. For details, please review our privacy policy.",
    },
    {
      question: "Do you offer educational discounts?",
      answer:
        "Yes, we offer special pricing for educational institutions. Contact our sales team for more information about our educational licensing options and volume discounts.",
    },
  ];

  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Find answers to common questions about Lucida.
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
