import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileText, Settings, Zap, Share2 } from "lucide-react";

const steps = [
  {
    icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: "Upload Inteligente",
    description:
      "Envie PDFs, DOCs ou texto. Nossa IA analisa automaticamente o conteúdo.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Settings className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: "Configuração Rápida",
    description:
      "Escolha formato, dificuldade e tipos de questões em poucos cliques.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: "Geração Instantânea",
    description:
      "IA cria questões contextualizadas e pedagogicamente estruturadas.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: <Share2 className="w-6 h-6 sm:w-8 sm:h-8" />,
    title: "Compartilhamento Fácil",
    description:
      "Publique online ou exporte em múltiplos formatos profissionais.",
    gradient: "from-green-500 to-emerald-500",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 px-3 sm:px-4 lg:px-8 py-16 sm:py-32"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Como Funciona
          </h2>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Processo simplificado em 4 etapas
          </p>
        </div>

        {/* Mobile-optimized grid - Stack on mobile, 2x2 on tablet, 4x1 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connection Line - Only show on desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-slate-600 to-transparent"></div>
              )}

              <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-500 group-hover:scale-105 h-full">
                <CardHeader className="text-center p-4 sm:p-6 lg:p-8">
                  <div
                    className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${step.gradient} p-3 sm:p-4 mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="text-white">{step.icon}</div>
                  </div>
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 text-xs sm:text-sm font-bold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-white text-base sm:text-lg mb-3 sm:mb-4">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 leading-relaxed text-sm sm:text-base">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
