import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { localization } from "@/helpers/localization";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lucida - Crie Provas em Segundos com IA",
  description: "Economize horas de preparação e crie avaliações melhores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={localization}>
      <html lang="pt-BR" suppressHydrationWarning>
        <Analytics />
        <SpeedInsights />
        <GoogleTagManager gtmId="GTM-NWBZ58SG" />
        <body
          className={`${inter.className} antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider attribute="class" enableSystem>
            <TooltipProvider>
              <div className="flex min-h-screen flex-col">
                <main className="flex-1 ">{children}</main>
              </div>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
