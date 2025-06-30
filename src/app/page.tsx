"use client";

import ActionButtons from "@/components/hero-action-buttons";
import { NavBar } from "@/components/layout/navbar";
import LucidaLogo from "@/components/lucida-logo";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Preços", href: "/pricing" },
    { name: "Como Funciona", href: "/how-it-works" },
    { name: "FAQ", href: "/faq" },
  ];

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col w-full px-16 py-8 h-screen bg-black">
      <div className="absolute top-40 left-20 w-[400px] h-[400px] bg-cyan-900 rounded-full mix-blend-screen filter blur-3xl opacity-80 animate-blob z-10"></div>
      <div className="absolute top-60 right-60 w-[400px] h-[400px] bg-pink-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000 z-10"></div>
      <div className="absolute bottom-10 left-60 w-[600px] h-[500px] bg-emerald-900 rounded-full mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000 z-10"></div>
      <header className="flex h-16 items-center justify-between w-full dark relative z-10">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2 w-24">
            <LucidaLogo isDark={true} />
          </Link>
        </div>

        <nav className="hidden gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton>
              <Button className="dark">Entrar</Button>
            </SignInButton>
          )}
        </div>
      </header>

      <div className="flex flex-col w-full h-full rounded-3xl justify-center items-center gap-4 absolute bottom-0 left-0">
        <h2 className="text-5xl font-semibold w-3/5 text-center text-white">
          Crie Provas Profissionais em Segundos com IA
        </h2>
        <ActionButtons />
      </div>
    </div>
  );
}
