"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import LucidaLogo from "../lucida-logo";
import { useNavItems } from "./dashboard-nav";
import { Badge } from "@/components/ui/badge";

export function DashboardMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navItems = useNavItems();

  return (
    <header className="bg-apple-secondary-system-background border-b border-apple-gray-4 backdrop-blur supports-[backdrop-filter]:bg-apple-secondary-system-background/95">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-20">
            <LucidaLogo />
          </div>
        </Link>

        {/* Right side - User Button and Menu */}
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                userButtonTrigger:
                  "shadow-none dark:text-[rgb(var(--apple-label))] text-[rgb(var(--apple-label))]",
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

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="plain"
                size="icon"
                className="touch-manipulation"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-apple px-3 py-3 text-muted-foreground apple-transition hover:text-foreground hover:bg-apple-blue/5 touch-manipulation",
                      pathname === item.href &&
                        "bg-apple-blue/10 text-apple-blue font-medium dark:bg-apple-blue/20",
                      item.disabled &&
                        "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    {item.icon}
                    <span className="text-sm flex items-center gap-2">
                      {item.title}
                      {item.isNew && (
                        <span className="inline-flex items-center rounded-full bg-apple-red text-white text-caption-2 font-semibold px-2 py-0.5 tracking-wide">
                          Novidade
                        </span>
                      )}
                    </span>
                  </Link>
                ))}

                {/* Logout */}
                <div className="border-t border-border mt-4 pt-4">
                  <SignOutButton>
                    <button className="flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50 w-full text-left touch-manipulation">
                      <LogOut className="h-5 w-5" />
                      <span className="text-sm">Sair</span>
                    </button>
                  </SignOutButton>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
