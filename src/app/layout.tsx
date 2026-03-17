import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { localization } from "@/helpers/localization";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      <html lang="pt-BR">
        <Analytics />
        <SpeedInsights />
        <GoogleTagManager gtmId="GTM-NWBZ58SG" />
        <body className={`${poppins.className} antialiased`}>
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
