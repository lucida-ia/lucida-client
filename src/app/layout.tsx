import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
const inter = Inter({ subsets: ["latin"] });

import { ptBR } from "@clerk/localizations";

export const metadata: Metadata = {
  title: "Lucida - Crie Provas Profissionais em Segundos com IA",
  description: "Economize horas de preparação e crie avaliações melhores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <ThemeProvider attribute="class" enableSystem>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <main className="flex-1">{children}</main>
              </div>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
