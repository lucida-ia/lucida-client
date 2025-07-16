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
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Pricing from "@/components/pricing";

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

  // Scroll event listener to detect when user scrolls past hero section
  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector(
        "#hero-section"
      ) as HTMLElement;
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY + 100; // Add some offset for smooth transition
        setIsScrolled(scrollPosition > heroBottom);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show loading state while checking authentication
  if (isSignedIn && user) {
    return null; // Don't render anything while redirecting
  }

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Criação em Segundos",
      description: "Nossa IA gera provas completas em segundos, não horas",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Qualidade Profissional",
      description:
        "Questões elaboradas com base em técnicas pedagógicas modernas",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Para Todos os Níveis",
      description: "Do ensino fundamental ao superior, todas as disciplinas",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "100% Seguro",
      description:
        "Seus dados e materiais protegidos com criptografia avançada",
    },
  ];

  const steps = [
    {
      icon: <FileText className="w-8 h-8 text-blue-400" />,
      title: "Envie seu material",
      description:
        "Faça upload de arquivos PDF ou DOCX com o conteúdo que deseja transformar em prova.",
    },
    {
      icon: <Settings className="w-8 h-8 text-green-400" />,
      title: "Personalize a prova",
      description:
        "Escolha o número de questões, formato (simples ou ENEM), nível de dificuldade e tipos de questões.",
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Gere e revise",
      description:
        "A IA gera as questões automaticamente. Revise, ajuste se necessário e salve sua prova.",
    },
    {
      icon: <Share2 className="w-8 h-8 text-purple-400" />,
      title: "Compartilhe ou aplique",
      description:
        "Compartilhe o link da prova com seus alunos ou aplique diretamente pela plataforma.",
    },
  ];

  const plans = [
    {
      name: "Básico",
      description: "Para quem está começando ou tem poucas demandas.",
      price: "R$17,90",
      period: "por mês",
      features: [
        "Até 10 provas por mês",
        "Apenas formato simples de questão",
        "Geração padrão com IA",
        "Suporte por email",
      ],
      cta: "Entrar na Lista de Espera",
      popular: false,
      href: "/sign-up",
    },
    {
      name: "Pro",
      description: "Para quem precisa de mais flexibilidade e recursos.",
      price: "R$27,90",
      period: "por mês",
      features: [
        "Até 30 provas por mês",
        "Todos os formatos de questões",
        "Geração avançada com IA",
        "Suporte prioritário por email",
      ],
      cta: "Entrar na Lista de Espera",
      popular: true,
      href: "/sign-up",
    },
    {
      name: "Personalizado",
      description: "Soluções sob medida para grandes demandas ou instituições.",
      price: "",
      period: "Fale com vendas para um plano personalizado",
      features: [],
      cta: "Entrar na Lista de Espera",
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
        "O Lucida suporta vários formatos de arquivo, incluindo PDF, DOC/DOCX (Microsoft Word), TXT. Você pode enviar anotações de aula, capítulos de livros, guias de estudo ou qualquer outro material de aprendizado baseado em texto.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Moving Gradient Blob 1 - Horizontal drift */}
        <div
          className="absolute top-20 left-20 w-80 h-80 rounded-full mix-blend-multiply filter blur-2xl opacity-70"
          style={{
            animation: "float-horizontal 25s ease-in-out infinite",
          }}
        ></div>

        {/* Moving Gradient Blob 2 - Vertical float */}
        <div
          className="absolute top-40 right-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: "float-vertical 30s ease-in-out infinite 2s",
          }}
        ></div>

        {/* Moving Gradient Blob 3 - Diagonal movement */}
        <div
          className="absolute bottom-32 left-40 w-72 h-72 rounded-full mix-blend-multiply filter blur-2xl opacity-75"
          style={{
            animation: "float-diagonal 35s ease-in-out infinite 4s",
          }}
        ></div>

        {/* Moving Gradient Blob 4 - Circular motion */}
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full mix-blend-multiply filter blur-xl opacity-50"
          style={{
            animation: "float-circular 40s linear infinite 6s",
          }}
        ></div>

        {/* Moving Gradient Blob 5 - Slow drift */}
        <div
          className="absolute bottom-20 right-32 w-88 h-88 rounded-full mix-blend-multiply filter blur-3xl opacity-65"
          style={{
            animation: "float-slow-drift 45s ease-in-out infinite 8s",
          }}
        ></div>

        {/* Moving Gradient Blob 6 - Gentle pulse with movement */}
        <div
          className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-55"
          style={{
            animation: "float-pulse-move 20s ease-in-out infinite 10s",
          }}
        ></div>
      </div>

      {/* Navigation */}
      <div
        className={`${
          isScrolled ? "fixed top-0 left-0 right-0 z-50" : "relative z-10"
        } px-4 sm:px-6 lg:px-32 navbar-transition`}
      >
        {/* Animated background overlay */}
        <div
          className={`absolute inset-0 navbar-background-transition ${
            isScrolled
              ? "bg-black/80 backdrop-blur-md border-b border-white/10 shadow-lg opacity-100 transform scale-100"
              : "bg-transparent opacity-0 transform scale-95 blur-sm"
          }`}
        ></div>

        {/* Content wrapper with smooth animations */}
        <div
          className={`relative z-10 navbar-transition transform ${
            isScrolled
              ? "py-3 translate-y-0 scale-100"
              : "py-4 translate-y-0 scale-100"
          }`}
        >
          <div
            className={`navbar-transition ${
              isScrolled ? "opacity-100" : "opacity-100"
            }`}
          >
            <NavBar />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        id="hero-section"
        className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 lg:py-32"
      >
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-8 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Exams with AI
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Crie Provas com IA em{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Segundos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme seu material didático em provas com IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/waitlist">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
              >
                Entrar na Lista de Espera
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="#como-funciona">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white bg-white/10 hover:bg-white/20 px-8 py-6 text-lg"
              >
                Como Funciona
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 rounded-2xl p-4 w-fit mx-auto mb-4 border border-white/20 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer for sticky navbar */}
      {isScrolled && <div className="h-20"></div>}

      {/* How It Works Section */}
      <section
        id="como-funciona"
        className="relative z-10 px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Como Funciona o Lucida
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Processo simples para criar avaliações profissionais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto bg-white/10 rounded-full p-4 w-fit mb-4">
                    {step.icon}
                  </div>
                  <CardTitle className="text-white text-lg">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 text-sm text-center">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* <Pricing /> */}
      <section id="precos" className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Planos para Cada Necessidade
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Escolha o plano ideal com tecnologia de IA inclusa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 relative ${
                  plan.popular
                    ? "border-cyan-500/50 shadow-2xl shadow-cyan-500/25"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-full text-white text-sm font-semibold">
                    Mais Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    {plan.price && (
                      <div className="text-4xl font-bold text-white">
                        {plan.price}
                      </div>
                    )}
                    <div className="text-white/60 text-sm">{plan.period}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-white/90"
                      >
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full text-white ${
                      plan.popular
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        : "bg-white/10 hover:bg-white/20 border border-white/20"
                    }`}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-white/80">
              Principais dúvidas sobre nossa plataforma
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-white/20"
              >
                <AccordionTrigger className="text-white hover:text-white/80 text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/80 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact Us Section */}
      <section
        id="contato"
        className="relative z-10 px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Entre em Contato
            </h2>
            <p className="text-lg text-white/80">
              Tem dúvidas ou precisa de ajuda? Fale conosco!
            </p>
          </div>

          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Envie sua Mensagem
                </h3>
                <p className="text-white/70 text-sm">
                  Preencha o formulário e responderemos em breve
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Seu Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Digite seu nome"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Seu Email
                    </label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Assunto
                  </label>
                  <input
                    type="text"
                    placeholder="Sobre o que você gostaria de falar?"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Mensagem
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escreva sua mensagem aqui..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                        headers: {
                          "Content-Type": "application/json",
                        },
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

                        // Clear form
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
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="mr-2"
                      >
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para Revolucionar suas Avaliações?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Junte-se à nossa comunidade de educadores que já estão criando
            provas incríveis com nossa IA
          </p>
          <Link href="/waitlist">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-2xl"
            >
              Entrar na Lista de Espera
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 border-t border-white/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white/70">
            <p className="text-sm">
              © 2025 Lucida. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
