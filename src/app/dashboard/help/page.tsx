"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Bug,
  ArrowRight,
  X,
} from "lucide-react";

export default function HelpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, whatsapp, subject, message } = formData;

    if (
      !name.trim() ||
      !email.trim() ||
      !message.trim() ||
      !whatsapp.trim() ||
      !subject.trim()
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
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
          subject: `[Dashboard] ${subject.trim()}`,
          message: `${message.trim()}\n\n--- Enviado através da página de Ajuda do Dashboard ---`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Mensagem enviada!",
          description:
            "Recebemos sua mensagem e entraremos em contato em breve.",
        });
        setFormData({
          name: "",
          email: "",
          whatsapp: "",
          subject: "",
          message: "",
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: data.error || "Ocorreu um erro ao enviar sua mensagem.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão com a internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonTopics = [
    {
      icon: <Bug className="h-5 w-5" />,
      title: "Reportar Bug",
      description: "Encontrou algum problema? Nos conte sobre ele.",
      colors: {
        ring: "ring-red-500 dark:ring-red-400",
        bg: "bg-red-50 dark:bg-red-950/50",
        border: "border-red-500 dark:border-red-400",
        iconBg: "bg-red-500 dark:bg-red-600",
        iconText: "text-white",
        indicator: "bg-red-500 dark:bg-red-400",
      },
      action: () => {
        setFormData((prev) => ({ ...prev, subject: "Reportar Bug" }));
        setSelectedTopicIndex(0);
      },
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Sugestão de Melhoria",
      description: "Tem alguma ideia para melhorar o Lucida?",
      colors: {
        ring: "ring-blue-500 dark:ring-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-500 dark:border-blue-400",
        iconBg: "bg-blue-500 dark:bg-blue-600",
        iconText: "text-white",
        indicator: "bg-blue-500 dark:bg-blue-400",
      },
      action: () => {
        setFormData((prev) => ({ ...prev, subject: "Sugestão de Melhoria" }));
        setSelectedTopicIndex(1);
      },
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Dúvida Geral",
      description: "Precisa de ajuda com alguma funcionalidade?",
      colors: {
        ring: "ring-green-500 dark:ring-green-400",
        bg: "bg-green-50 dark:bg-green-950/50",
        border: "border-green-500 dark:border-green-400",
        iconBg: "bg-green-500 dark:bg-green-600",
        iconText: "text-white",
        indicator: "bg-green-500 dark:bg-green-400",
      },
      action: () => {
        setFormData((prev) => ({ ...prev, subject: "Dúvida Geral" }));
        setSelectedTopicIndex(2);
      },
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Outro Assunto",
      description: "Qualquer outra questão ou feedback.",
      colors: {
        ring: "ring-purple-500 dark:ring-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950/50",
        border: "border-purple-500 dark:border-purple-400",
        iconBg: "bg-purple-500 dark:bg-purple-600",
        iconText: "text-white",
        indicator: "bg-purple-500 dark:bg-purple-400",
      },
      action: () => {
        setFormData((prev) => ({ ...prev, subject: "Outro Assunto" }));
        setSelectedTopicIndex(3);
      },
    },
  ];

  const clearSelection = () => {
    setSelectedTopicIndex(null);
    setFormData((prev) => ({ ...prev, subject: "" }));
  };

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader
        heading="Ajuda"
        text="Reporte bugs, tire dúvidas ou envie sugestões. Nossa equipe está aqui para ajudar!"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Topics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Como podemos ajudar?</h3>
          <div className="grid gap-3">
            {commonTopics.map((topic, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-colors ${
                  selectedTopicIndex === index
                    ? `ring-2 ${topic.colors.ring} ${topic.colors.bg} ${topic.colors.border}`
                    : "hover:bg-muted/50"
                }`}
                onClick={topic.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        selectedTopicIndex === index
                          ? `${topic.colors.iconBg} ${topic.colors.iconText}`
                          : "bg-primary/10"
                      }`}
                    >
                      {topic.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{topic.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {topic.description}
                      </p>
                    </div>
                    {selectedTopicIndex === index && (
                      <div className="flex-shrink-0">
                        <div
                          className={`w-6 h-6 ${topic.colors.indicator} rounded-full flex items-center justify-center`}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Envie sua mensagem</h3>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome *</label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={formData.name}
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WhatsApp *</label>
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.whatsapp}
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assunto *</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Como podemos ajudar?"
                        value={formData.subject}
                        required
                        readOnly={selectedTopicIndex !== null}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className={selectedTopicIndex !== null ? "pr-8" : ""}
                      />
                      {selectedTopicIndex !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-muted"
                          onClick={clearSelection}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem *</label>
                  <Textarea
                    rows={4}
                    placeholder="Descreva sua dúvida, sugestão ou problema..."
                    value={formData.message}
                    required
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensagem
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
