"use client";

import { Button } from "@/components/ui/button";
import { TypingAnimation } from "@/components/typing-animation";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="relative z-10 flex items-center justify-center px-3 sm:px-4 lg:px-8 sm:pt-24 pt-8 pb-0"
      style={{ height: "75vh", minHeight: "700px" }}
    >
      <div className="max-w-7xl mx-auto text-center">
        {/* Badge with Modern Design - Mobile optimized */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-xs sm:text-sm font-medium">
            Powered by AI
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>

        {/* Main Headline - Mobile responsive typography */}
        <h1 className="text-5xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-[0.9] tracking-tight px-2">
          Crie{" "}
          <TypingAnimation
            words={[
              "Provas",
              "Avaliações",
              "Quizzes",
              "Simulados",
              "Atividades",
            ]}
            typingSpeed={120}
            deletingSpeed={80}
            pauseDuration={1500}
            className="text-white"
          />{" "}
          com
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
            IA em Segundos
          </span>
        </h1>

        {/* Subtitle - Mobile optimized */}
        <p className="text-base sm:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-4">
          Transforme seu material didático em avaliações com IA.
          <br />
          <span className="text-slate-400">
            Rápido, inteligente e personalizado.
          </span>
        </p>

        {/* Modern CTA Buttons - Mobile optimized */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-4 px-4">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-2xl shadow-blue-500/25 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[44px]"
            >
              Começar Agora!
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
