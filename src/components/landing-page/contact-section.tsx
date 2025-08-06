"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
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
                  const { name, email, whatsapp, subject, message } = formData;

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
  );
}
