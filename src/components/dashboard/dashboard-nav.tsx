"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Folder,
  Settings,
  CreditCard,
  LogOut,
  UsersRound,
  DotIcon,
  SunIcon,
  MoonIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  HelpCircle,
  FileCheck,
  BarChart3,
} from "lucide-react";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import LucidaLogo from "../lucida-logo";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";

// Custom hook for localStorage that handles SSR
function useLocalStorage(key: string, initialValue: boolean) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  const setValue = (value: boolean) => {
    try {
      setStoredValue(value);
      if (isLoaded) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded] as const;
}
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
 

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  role?: string[];
  disabled?: boolean;
  isNew?: boolean;
};

// Export navigation items for reuse in mobile component
export function useNavItems() {
  const { shouldHideBilling, subscription } = useSubscription();

  const allNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      role: ["admin", "student", "teacher"],
    },
    {
      title: "Criar Avaliação",
      href: "/dashboard/exams/create",
      icon: <FileText className="h-5 w-5" />,
      role: ["admin", "teacher"],
    },
    {
      title: "Minhas Avaliações",
      href: "/dashboard/overview",
      icon: <FileCheck className="h-5 w-5" />,
      role: ["admin", "teacher"],
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      role: ["admin", "teacher"],
      isNew: true,
    },
    {
      title: "Planos",
      href: "/dashboard/billing",
      icon: <CreditCard className="h-5 w-5" />,
      disabled: shouldHideBilling,
    },
    {
      title: "Ajuda",
      href: "/dashboard/help",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];

  // Derive a simple role from subscription plan
  const plan = subscription?.plan;
  const currentRole: string =
    plan === "admin" ? "admin" : plan === "trial" ? "student" : "teacher";

  // Filter items by role if specified
  const visibleNavItems = allNavItems.filter((item) => {
    if (!item.role) return true;
    return item.role.includes(currentRole);
  });

  return visibleNavItems;
}

export function DashboardNav() {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed, isLoaded] = useLocalStorage(
    "navbar-collapsed",
    false
  );
  const { shouldHideBilling, loading: subscriptionLoading } = useSubscription();
  const { user } = useUser();

  const pathname = usePathname();
  const router = useRouter();
  const navItems = useNavItems();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "hidden border-r bg-muted/40 lg:block sticky top-0 left-0 h-screen transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 justify-between">
            {!isCollapsed && (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 w-24"
              >
                <LucidaLogo />
              </Link>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium gap-1">
              {navItems.map((item, index) => (
                <div key={index}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          disabled={item.disabled}
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "w-full justify-center p-2 h-10",
                            pathname === item.href && "bg-muted text-primary"
                          )}
                          asChild
                        >
                          <Link href={item.href} className="relative">
                            <div className="relative flex items-center justify-center">
                              {item.icon}
                              {item.isNew && (
                                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
                              )}
                            </div>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <p>{item.title}</p>
                          {item.isNew && (
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-semibold px-2 py-0.5 tracking-wide shadow-sm">
                              Novidade
                            </span>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      disabled={item.disabled}
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3",
                        pathname === item.href && "bg-muted text-primary"
                      )}
                      asChild
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {item.icon}
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.isNew && (
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-semibold px-2 py-0.5  tracking-wide shadow-sm">
                              Novidade
                            </span>
                          )}
                        </span>
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex justify-center items-center p-2">
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonTrigger:
                              "shadow-none dark:text-white text-black",
                            button: "shadow-none",
                          },
                        }}
                      >
                        <UserButton.MenuItems>
                          <UserButton.Action
                            label={
                              theme === "dark" ? "Light Mode" : "Dark Mode"
                            }
                            labelIcon={
                              theme === "dark" ? (
                                <SunIcon className="w-4 h-4" />
                              ) : (
                                <MoonIcon className="w-4 h-4" />
                              )
                            }
                            onClick={() =>
                              setTheme(theme === "dark" ? "light" : "dark")
                            }
                          />
                        </UserButton.MenuItems>
                      </UserButton>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{user?.firstName || user?.username || "Usuário"}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="w-full flex justify-center items-center p-2 rounded-lg hover:cursor-pointer hover:bg-muted/50 transition-all duration-300 border border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20">
                  <UserButton
                    showName={true}
                    appearance={{
                      elements: {
                        userButtonTrigger:
                          "shadow-none dark:text-white text-black",
                        button: "shadow-none",
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label={theme === "dark" ? "Light Mode" : "Dark Mode"}
                        labelIcon={
                          theme === "dark" ? (
                            <SunIcon className="w-4 h-4" />
                          ) : (
                            <MoonIcon className="w-4 h-4" />
                          )
                        }
                        onClick={() =>
                          setTheme(theme === "dark" ? "light" : "dark")
                        }
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
