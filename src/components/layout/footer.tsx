"use client";

import { useTheme } from "next-themes";

import Link from "next/link";
import LucidaLogo from "../lucida-logo";

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t bg-background">
      <div className="container py-10 md:py-16 mx-auto">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 w-32 h-12">
              <LucidaLogo />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Gere provas profissionais em segundos com nossa plataforma
              platform.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Produto</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/features" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-foreground">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Empresa</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-foreground">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lucida. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-muted-foreground">
              Feito com {theme == "dark" ? "🖤" : "🤍"} por{" "}
              <Link
                target="_blank"
                href="https://www.linkedin.com/in/pedroomour/"
                className="hover:text-foreground"
              >
                Pedro Moura
              </Link>{" "}
              e{" "}
              <Link
                target="_blank"
                href="https://jotape.me/"
                className="hover:text-foreground"
              >
                João Pedro de Moura
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
