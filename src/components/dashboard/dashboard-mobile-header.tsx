"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogOut } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import LucidaLogo from "../lucida-logo";
import { useNavItems } from "./dashboard-nav";

export function DashboardMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navItems = useNavItems();

  return (
    <header className="bg-background border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/95">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-20">
            <LucidaLogo />
          </div>
        </Link>

        {/* Right side - User Button and Menu */}
        <div className="flex items-center gap-3">
          <UserButton />
          
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-manipulation">
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
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50 touch-manipulation",
                      pathname === item.href && "bg-muted text-primary font-medium",
                      item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    {item.icon}
                    <span className="text-sm">{item.title}</span>
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