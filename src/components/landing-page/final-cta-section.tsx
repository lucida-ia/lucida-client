import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function FinalCTASection() {
  return (
    <section className="relative z-10 px-3 sm:px-4 lg:px-8 py-16 sm:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Pronto para o Futuro da Educação?
          </h2>
          <p className="text-base sm:text-xl text-slate-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Junte-se à nossa comunidade de educadores que já estão criando
            provas incríveis com nossa IA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-xl shadow-blue-500/25 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[44px]"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
