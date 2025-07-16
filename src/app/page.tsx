"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
  FileText,
  Settings,
  Zap,
  Share2,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  Shield,
  Star,
  ArrowUpRight,
  Plus,
  Brain,
  Lightbulb,
  Target,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  const { isSignedIn, user } = useUser();

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navbar scroll state
  const [isScrolled, setIsScrolled] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isSignedIn && user) {
      redirect("/dashboard");
    }
  }, [isSignedIn, user]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show loading state while checking authentication
  if (isSignedIn && user) {
    return null;
  }

  const features = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Geração Instantânea",
      description: "Provas prontas em segundos",
      size: "small",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "100% Seguro",
      description:
        "Seus dados e materiais protegidos com criptografia avançada",
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

  const plans = [
    {
      name: "Starter",
      description: "Perfeito para começar",
      price: "R$17,90",
      period: "/mês",
      features: [
        "10 provas por mês",
        "Formato simples",
        "IA básica",
        "Suporte por email",
        "Exportação PDF",
      ],
      cta: "Começar Grátis",
      popular: false,
      href: "/sign-up",
    },
    {
      name: "Professional",
      description: "Para educadores dedicados",
      price: "R$27,90",
      period: "/mês",
      features: [
        "30 provas por mês",
        "Todos os formatos",
        "IA avançada",
        "Suporte prioritário",
        "Múltiplos formatos",
        "Analytics avançado",
        "Banco de questões",
      ],
      cta: "Mais Popular",
      popular: true,
      href: "/sign-up",
    },
    {
      name: "Enterprise",
      description: "Para instituições",
      price: "Personalizado",
      period: "",
      features: [
        "Provas ilimitadas",
        "API dedicada",
        "Suporte 24/7",
        "Integração personalizada",
        "Treinamento incluso",
      ],
      cta: "Falar com Vendas",
      popular: false,
      href: "/sign-up",
    },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden text-white dark">
      {/* Enhanced Background Effects - Optimized for mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Orbs - Smaller on mobile */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>

        {/* Grid Pattern - Responsive sizing */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] sm:bg-[size:24px_24px]"></div>
      </div>

      {/* Modern Floating Navigation - Mobile optimized */}
      <div
        className={`fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-50 transition-all duration-500 ${
          isScrolled
            ? "translate-y-0 opacity-100"
            : "translate-y-1 sm:translate-y-2 opacity-90"
        }`}
      >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl py-2 shadow-2xl max-w-5xl mx-auto px-2 sm:px-4">
          <NavBar />
        </div>
      </div>

      {/* Hero Section - Mobile optimized */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 lg:px-8 pt-20 sm:pt-0">
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
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-[0.9] tracking-tight px-2">
            Crie Provas com
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              IA em Segundos
            </span>
          </h1>

          {/* Subtitle - Mobile optimized */}
          <p className="text-base sm:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-4">
            Transforme seu material didático em provas com IA.
            <br />
            <span className="text-slate-400">
              Rápido, inteligente e personalizado.
            </span>
          </p>

          {/* Modern CTA Buttons - Mobile optimized */}
          <div className="flex flex-col md:flex-row	 gap-3 sm:gap-4 justify-center items-center mb-16 sm:mb-20 px-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-2xl shadow-blue-500/25 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[44px]"
              >
                Começar Agora!
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              disabled
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg backdrop-blur-sm rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto min-h-[44px]"
            >
              <span>Ver Demo</span>
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features - Mobile optimized Bento Grid */}
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

      {/* How It Works - Mobile optimized */}
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

      {/* FAQ - Mobile optimized */}
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
                  <AccordionItem
                    value={`item-${index}`}
                    className="border-none"
                  >
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

      {/* Contact - Mobile optimized form */}
      <section
        id="contact"
        className="relative z-10 px-3 sm:px-4 lg:px-8 py-16 sm:py-32"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
              Vamos Conversar
            </h2>
            <p className="text-base sm:text-xl text-slate-400 px-4">
              Tem dúvidas? Nossa equipe está pronta para ajudar
            </p>
          </div>

          <Card className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-8 lg:p-12">
              {/* Mobile-first form layout */}
              <div className="space-y-4 sm:space-y-6">
                {/* Name and Email - Stack on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-white text-sm font-medium">
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-sm font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                </div>

                {/* WhatsApp and Subject - Stack on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-white text-sm font-medium">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-white text-sm font-medium">
                      Assunto
                    </label>
                    <input
                      type="text"
                      placeholder="Como podemos ajudar?"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="block text-white text-sm font-medium">
                    Mensagem
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Conte-nos mais sobre suas necessidades..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all text-sm sm:text-base"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] min-h-[44px] text-sm sm:text-base"
                  disabled={isSubmitting}
                  onClick={async () => {
                    const { name, email, whatsapp, subject, message } =
                      formData;

                    if (
                      !name.trim() ||
                      !email.trim() ||
                      !message.trim() ||
                      !whatsapp.trim() ||
                      !subject.trim()
                    ) {
                      alert("Por favor, preencha todos os campos.");
                      return;
                    }

                    setIsSubmitting(true);

                    try {
                      const response = await fetch("/api/contact", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: name.trim(),
                          email: email.trim(),
                          whatsapp: whatsapp.trim(),
                          subject: subject.trim(),
                          message: message.trim(),
                        }),
                      });

                      const data = await response.json();

                      if (response.ok) {
                        alert(
                          "✅ Mensagem enviada com sucesso! Entraremos em contato em breve."
                        );
                        setFormData({
                          name: "",
                          email: "",
                          whatsapp: "",
                          subject: "",
                          message: "",
                        });
                      } else {
                        alert(`❌ Erro: ${data.error}`);
                      }
                    } catch (error) {
                      console.error("Error sending message:", error);
                      alert(
                        "❌ Erro ao enviar mensagem. Verifique sua conexão e tente novamente."
                      );
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensagem
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA - Mobile optimized */}
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

      {/* Modern Footer - Mobile optimized */}
      <footer className="relative z-10 px-3 sm:px-4 lg:px-8 py-8 sm:py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            © 2025 Lucida. Transformando educação com inteligência artificial.
          </p>
        </div>
      </footer>
    </div>
  );
}
