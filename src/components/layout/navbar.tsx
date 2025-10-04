"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

import LucidaLogo from "../lucida-logo";

export function NavBar() {
  const { isSignedIn, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "Como Funciona", href: "#how-it-works" },
    { name: "Preços", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
    { name: "Contato", href: "#contact" },
  ];

  return (
    <div className="dark">
      {/* Ensure dark mode for entire navbar */}
      {/* Desktop Navigation */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto dark">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-24 h-auto">
            <LucidaLogo isDark={true} />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
              onClick={(e) => {
                if (item.href.startsWith("#")) {
                  e.preventDefault();
                  const element = document.querySelector(item.href);
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }
              }}
            >
              <span className="flex items-center gap-2">
                {item.name}
                {item.name === "Preços" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                    PROMO
                  </span>
                )}
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* Auth Button */}
        <div className="flex items-center">
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonTrigger: "shadow-none dark:text-white text-white",
                  button: "shadow-none",
                  userButtonPopoverCard:
                    "bg-[rgb(var(--apple-secondary-grouped-background))] border-[rgb(var(--apple-gray-4))] apple-shadow-lg",
                  userButtonPopoverActionButton:
                    "text-[rgb(var(--apple-label))] hover:bg-[rgb(var(--apple-gray-6))] dark:hover:bg-[rgb(var(--apple-gray-5))] apple-transition-fast",
                  userButtonPopoverActionButtonText: "text-subhead",
                  userButtonPopoverActionButtonIcon:
                    "text-[rgb(var(--apple-secondary-label))]",
                  userButtonPopoverFooter:
                    "bg-[rgb(var(--apple-secondary-grouped-background))] border-t-[rgb(var(--apple-gray-4))]",
                  userButtonPopoverFooterAction:
                    "text-[rgb(var(--apple-secondary-label))] hover:text-[rgb(var(--apple-label))]",
                  userButtonPopoverMain:
                    "bg-[rgb(var(--apple-secondary-grouped-background))]",
                  userButtonPopoverHeader:
                    "bg-[rgb(var(--apple-secondary-grouped-background))]",
                  userButtonPopoverHeaderTitle:
                    "text-[rgb(var(--apple-label))] font-medium",
                  userButtonPopoverHeaderSubtitle:
                    "text-[rgb(var(--apple-secondary-label))]",
                  userButtonPopoverIdentity:
                    "bg-[rgb(var(--apple-secondary-grouped-background))]",
                  userButtonPopoverIdentityBox:
                    "bg-[rgb(var(--apple-secondary-grouped-background))]",
                  userButtonPopoverIdentityText:
                    "text-[rgb(var(--apple-label))] font-medium",
                  userButtonPopoverIdentitySecondaryText:
                    "text-[rgb(var(--apple-secondary-label))]",
                },
              }}
            />
          ) : (
            <Link href="/sign-in">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
              >
                Entrar
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button> */}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Menu Content */}
          <div className="absolute top-20 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <nav className="space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-3 px-4 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    if (item.href.startsWith("#")) {
                      e.preventDefault();
                      setTimeout(() => {
                        const element = document.querySelector(item.href);
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }, 100);
                    }
                  }}
                >
                  <span className="flex items-center justify-between">
                    {item.name}
                    {item.name === "Preços" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                        PROMO
                      </span>
                    )}
                  </span>
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-white/10">
                {!isSignedIn && (
                  <Link
                    href="/sign-in"
                    className="block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                      Entrar
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
