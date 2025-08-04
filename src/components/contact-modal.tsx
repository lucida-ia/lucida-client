"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

interface ContactForm {
  name: string;
  email: string;
  whatsapp: string;
  subject: string;
  message: string;
}

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    whatsapp: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          whatsapp: "",
          subject: "",
          message: "",
        });
        // Close modal after 2 seconds on success
        setTimeout(() => {
          onOpenChange(false);
          setSubmitStatus("idle");
        }, 2000);
      } else {
        setSubmitStatus("error");
        setErrorMessage(data.error || "Erro ao enviar mensagem. Tente novamente.");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && submitStatus === "success") {
      // Don't close if success message is showing
      return;
    }
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        name: "",
        email: "",
        whatsapp: "",
        subject: "",
        message: "",
      });
      setSubmitStatus("idle");
      setErrorMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Entre em Contato
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Tem alguma dúvida sobre nossos planos ou precisa de um plano personalizado? 
            Entre em contato conosco! Responderemos em até 24 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {submitStatus === "success" && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-700/50 dark:bg-green-950/30">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Mensagem enviada com sucesso! Entraremos em contato em breve.
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === "error" && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-700/50 dark:bg-red-950/30">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modal-name">Nome Completo *</Label>
                <Input
                  id="modal-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-email">Email *</Label>
                <Input
                  id="modal-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modal-whatsapp">WhatsApp *</Label>
                <Input
                  id="modal-whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-subject">Assunto *</Label>
                <Input
                  id="modal-subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder="Ex: Plano Personalizado"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-message">Mensagem *</Label>
              <Textarea
                id="modal-message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Descreva sua necessidade ou dúvida..."
                rows={4}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar Mensagem
                </div>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 