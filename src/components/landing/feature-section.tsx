import Image from "next/image";
import { Brain, Upload, Settings, Clock } from "lucide-react";

export function FeatureSection() {
  const features = [
    {
      icon: <Upload className="h-10 w-10 text-primary" />,
      title: "Upload Fácil",
      description:
        "Envie PDFs, documentos do Word e arquivos de texto com nossa interface intuitiva de arrastar e soltar.",
    },
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: "Geração com IA",
      description:
        "Nossa IA avançada analisa seu conteúdo e gera questões desafiadoras e relevantes em vários formatos.",
    },
    {
      icon: <Settings className="h-10 w-10 text-primary" />,
      title: "Personalizável",
      description:
        "Controle tipos de questões, níveis de dificuldade e estrutura da prova para atender suas necessidades específicas.",
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Economize Tempo",
      description:
        "Crie provas profissionais em minutos em vez de horas com nosso poderoso assistente de IA.",
    },
  ];

  return (
    <section
      id="features"
      className="w-full py-12 md:py-24 lg:py-32 bg-background"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Recursos que Transformam a Criação de Provas
            </h2>
            <p className=" text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Nossa plataforma com IA torna a criação de provas de alta
              qualidade mais rápida e fácil do que nunca.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 pt-12 md:pt-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm transition-all hover:shadow-md"
            >
              {feature.icon}
              <h3 className="text-xl font-bold text-center">{feature.title}</h3>
              <p className="text-center text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 lg:mt-24 grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Geração Inteligente de Questões
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa IA não apenas extrai questões do seu conteúdo - ela entende
              o contexto, identifica conceitos-chave e cria questões originais
              que testam a verdadeira compreensão.
            </p>
            <ul className="space-y-2">
              {[
                "Questões de múltipla escolha, verdadeiro/falso, resposta curta e dissertativas",
                "Níveis de dificuldade ajustáveis, desde recordação básica até análise avançada",
                "Ponderação personalizada para diferentes tópicos e conceitos",
                "Geração automática de gabarito para correção rápida",
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 text-primary flex-shrink-0"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-2 shadow-lg">
            <Image
              src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg"
              alt="Geração de Questões com IA"
              width={600}
              height={400}
              className="rounded shadow-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
