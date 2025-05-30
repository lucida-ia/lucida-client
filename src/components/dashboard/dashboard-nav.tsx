"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Book,
  LayoutDashboard,
  FileText,
  Folder,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import LucidaLogo from "../lucida-logo";

export function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Painel",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Criar Prova",
      href: "/dashboard/create",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Minhas Provas",
      href: "/dashboard/exams",
      icon: <Folder className="h-5 w-5" />,
    },
    {
      title: "Assinatura",
      href: "/dashboard/subscription",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Configurações",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="hidden border-r bg-muted/40 lg:block sticky top-0 left-0 w-64 h-screen">
      <div className="flex h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LucidaLogo className="w-24 h-10" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <SignOutButton>
            <Button variant="outline" className="w-full justify-start gap-3">
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
