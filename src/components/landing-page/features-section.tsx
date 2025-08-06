import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Shield, Users, Lightbulb } from "lucide-react";

const features = [
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Geração Instantânea",
    description: "Provas prontas em segundos",
    size: "small",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Totalmente Privado",
    description:
      "Seus materiais didáticos ficam seguros e privados em nossa plataforma",
    size: "large",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Para Todos os Níveis",
    description:
      "Desde fundamental até superior, todas as disciplinas com adaptação automática de dificuldade",
    size: "large",
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    title: "Personalizável",
    description: "Ajuste formato e estilo",
    size: "small",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative z-10 px-3 sm:px-4 lg:px-8 py-16 sm:py-32 w-full"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Recursos que Fazem a Diferença
          </h2>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Tecnologia de ponta para criar avaliações que realmente importam
          </p>
        </div>

        {/* Mobile-first Bento Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 ${
                feature.size === "large" ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <CardHeader className="p-4 sm:p-6 lg:p-8">
                <div
                  className={`w-fit p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <CardTitle className="text-white text-lg sm:text-xl mb-2 sm:mb-3 group-hover:text-blue-300 transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-slate-400 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
