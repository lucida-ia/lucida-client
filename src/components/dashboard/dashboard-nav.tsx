"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, getImpersonateUserId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Folder,
  FolderPlus,
  Settings,
  CreditCard,
  LogOut,
  UsersRound,
  DotIcon,
  SunIcon,
  MoonIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  HelpCircle,
  FileCheck,
  BarChart3,
  ClipboardCheck,
  ScanLine,
} from "lucide-react";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import LucidaLogo from "../lucida-logo";
import { useTheme } from "next-themes";
import React, { useState, useEffect, useCallback } from "react";
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
import axios from "axios";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Nav link (leaf item with href)
type NavLink = {
  title: string;
  href: string;
  icon: React.ReactNode;
  role?: string[];
  disabled?: boolean;
  isNew?: boolean;
};

// Nav group (section with children)
type NavGroup = {
  title: string;
  icon: React.ReactNode;
  role?: string[];
  children: NavLink[];
};

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item && Array.isArray((item as NavGroup).children);
}

// Flatten tree to list of links (for collapsed sidebar and mobile)
export function flattenNavItems(items: NavItem[], role: string): NavLink[] {
  return items.flatMap((item) => {
    if (isNavGroup(item)) {
      const visible = !item.role || item.role.includes(role);
      if (!visible) return [];
      return item.children.filter((c) => !c.role || c.role.includes(role));
    }
    const visible = !item.role || item.role.includes(role);
    return visible ? [item] : [];
  });
}

// Filter tree by role (groups with no visible children removed)
function filterNavItemsByRole(items: NavItem[], role: string): NavItem[] {
  return items.flatMap((item): NavItem[] => {
    if (isNavGroup(item)) {
      const groupVisible = !item.role || item.role.includes(role);
      if (!groupVisible) return [];
      const filteredChildren = item.children.filter(
        (c) => !c.role || c.role.includes(role),
      );
      if (filteredChildren.length === 0) return [];
      return [{ ...item, children: filteredChildren }];
    }
    const visible = !item.role || item.role.includes(role);
    return visible ? [item] : [];
  });
}

// Export navigation items (tree) for reuse in mobile component
export function useNavItems() {
  const { shouldHideBilling, subscription } = useSubscription();

  const plan = subscription?.plan;
  const currentRole: string =
    plan === "admin" ? "admin" : plan === "trial" ? "teacher" : "teacher";

  const allNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      role: ["admin", "student", "teacher"],
    },
    {
      title: "Avaliações",
      icon: <FileText className="h-5 w-5" />,
      role: ["admin", "teacher"],
      children: [
        {
          title: "Criar Avaliação",
          href: "/dashboard/exams/create",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Minhas Avaliações",
          href: "/dashboard/overview",
          icon: <FileCheck className="h-4 w-4" />,
        },
        {
          title: "Corrigir Avaliação",
          href: "/dashboard/corrigir",
          icon: <ClipboardCheck className="h-4 w-4" />,
          role: ["admin"],
        },
        {
          title: "Scanner",
          href: "/dashboard/scan",
          icon: <ScanLine className="h-4 w-4" />,
          isNew: false,
        },
      ],
    },
    {
      title: "Resultados",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      role: ["admin", "teacher"],
    },
    {
      title: "Configurações",
      icon: <Settings className="h-5 w-5" />,
      children: [
        {
          title: "Alunos",
          href: "/dashboard/students",
          icon: <UsersRound className="h-4 w-4" />,
          role: ["admin", "teacher"],
        },
        {
          title: "Turmas",
          href: "/dashboard/classes",
          icon: <Folder className="h-4 w-4" />,
          role: ["admin", "teacher"],
        },
        {
          title: "Planos",
          href: "/dashboard/billing",
          icon: <CreditCard className="h-4 w-4" />,
          disabled: shouldHideBilling,
        },
        {
          title: "Ajuda",
          href: "/dashboard/help",
          icon: <HelpCircle className="h-4 w-4" />,
        },
      ],
    },
  ];

  const visibleNavItems = filterNavItemsByRole(allNavItems, currentRole);
  return visibleNavItems;
}

export function DashboardNav() {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed, isLoaded] = useLocalStorage(
    "navbar-collapsed",
    false,
  );
  const { shouldHideBilling, loading: subscriptionLoading } = useSubscription();
  const { user } = useUser();
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const pathname = usePathname();
  const router = useRouter();
  const navItems = useNavItems();
  const { subscription } = useSubscription();
  const currentRole = subscription?.plan === "admin" ? "admin" : "teacher";
  const flatItems = flattenNavItems(navItems, currentRole);

  const isChildActive = (group: NavGroup) =>
    group.children.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
    );

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const asUser = getImpersonateUserId();
      const response = await axios.get(
        "/api/user" + (asUser ? `?asUser=${encodeURIComponent(asUser)}` : ""),
      );

      if (response.data.status === "success") {
        const data = response.data.data;
        setUserSubscription(data.user.subscription);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSubscriptionExpiry = useCallback(async () => {
    try {
      const response = await axios.post("/api/subscription/check-expiry");
      if (response.data.status === "success" && response.data.planUpdated) {
        // If plan was updated, refetch user data to get the updated subscription
        await fetchUserData();
      }
    } catch (error) {
      console.error("Error checking subscription expiry:", error);
    }
  }, [fetchUserData]);

  React.useEffect(() => {
    fetchUserData();
    checkSubscriptionExpiry();
  }, [fetchUserData, checkSubscriptionExpiry]);

  // Fetch pending grading count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch("/api/exam/results/pending-count");
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending count:", error);
      }
    };

    fetchPendingCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (userSubscription?.plan === "trial") {
      router.push("/dashboard/billing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSubscription?.plan]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "hidden bg-apple-secondary-system-background lg:block sticky top-0 left-0 h-screen apple-transition-slow",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-screen flex-col gap-2 pt-5">
          <div className="flex h-16 items-center px-4 justify-between">
            {!isCollapsed && (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 ml-3 w-3/4"
              >
                <LucidaLogo />
              </Link>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="grid items-start px-3 text-callout font-medium gap-1">
              {userSubscription?.plan === "trial" && (
                <div>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="plain"
                          className={cn(
                            "w-full justify-center p-2 h-11 rounded-apple",
                            pathname === "/dashboard/billing" &&
                              "bg-apple-blue/10 text-apple-blue",
                          )}
                          asChild
                        >
                          <Link href="/dashboard/billing" className="relative">
                            <div className="relative flex items-center justify-center">
                              <CreditCard className="h-5 w-5" />
                            </div>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <p>Planos</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      size="default"
                      variant="plain"
                      className={cn(
                        "w-full justify-start gap-3 h-11 rounded-apple",
                        pathname === "/dashboard/billing" &&
                          "bg-apple-blue/10 text-apple-blue",
                      )}
                      asChild
                    >
                      <Link
                        href="/dashboard/billing"
                        className={cn(
                          "flex items-center gap-3 rounded-apple px-3 py-2 text-muted-foreground apple-transition hover:text-foreground",
                        )}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="flex items-center gap-2">Planos</span>
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {userSubscription?.plan !== "trial" &&
                (isCollapsed
                  ? // Collapsed: show flattened icon-only links
                    flatItems.map((item, index) => (
                      <div key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              disabled={
                                item.disabled ||
                                userSubscription?.plan === "trial"
                              }
                              size="icon"
                              variant="plain"
                              className={cn(
                                "w-full justify-center p-2 h-11 rounded-apple",
                                (pathname === item.href ||
                                  pathname.startsWith(item.href + "/")) &&
                                  "bg-apple-blue/10 text-apple-blue",
                              )}
                              asChild
                            >
                              <Link href={item.href} className="relative">
                                <div className="relative flex items-center justify-center">
                                  {item.icon}
                                  {item.isNew && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-apple-red" />
                                  )}
                                </div>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="flex items-center gap-2">
                              <p>{item.title}</p>
                              {item.isNew && (
                                <span className="inline-flex items-center rounded-full bg-apple-red text-white text-caption-2 font-semibold px-2 py-0.5 tracking-wide">
                                  Novidade
                                </span>
                              )}
                              {item.href === "/dashboard/corrigir" &&
                                pendingCount > 0 && (
                                  <span className="rounded-full bg-orange-500 text-white text-xs font-medium px-1.5">
                                    {pendingCount}
                                  </span>
                                )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))
                  : // Expanded: show tree with collapsible groups
                    navItems.map((item, index) => {
                      if (isNavGroup(item)) {
                        const open = isChildActive(item);
                        return (
                          <Collapsible
                            key={index}
                            defaultOpen={open}
                            className="group/collapsible"
                          >
                            <CollapsibleTrigger asChild>
                              <Button
                                size="default"
                                variant="plain"
                                className={cn(
                                  "group/trigger w-full justify-between gap-2 h-11 rounded-apple px-3 py-2 text-muted-foreground apple-transition hover:text-foreground",
                                  open && "text-foreground",
                                )}
                              >
                                <span className="flex items-center gap-3">
                                  {item.icon}
                                  <span>{item.title}</span>
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/trigger:rotate-180" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-apple-gray-4 pl-3">
                                {item.children.map((child, childIndex) => {
                                  const isActive =
                                    pathname === child.href ||
                                    pathname.startsWith(child.href + "/");
                                  const disabled =
                                    child.disabled ||
                                    userSubscription?.plan === "trial";
                                  return (
                                    <Button
                                      key={childIndex}
                                      disabled={disabled}
                                      size="default"
                                      variant="plain"
                                      className={cn(
                                        "w-full justify-start gap-2 h-9 rounded-apple px-2 text-muted-foreground apple-transition hover:text-foreground",
                                        isActive &&
                                          "bg-apple-blue/10 text-apple-blue",
                                      )}
                                      asChild
                                    >
                                      <Link
                                        href={child.href}
                                        className={cn(
                                          "flex items-center gap-2",
                                          disabled &&
                                            "opacity-50 cursor-not-allowed",
                                        )}
                                      >
                                        {child.icon}
                                        <span className="flex items-center gap-2 text-sm">
                                          {child.title}
                                          {child.isNew && (
                                            <span className="inline-flex items-center rounded-full bg-apple-red text-white text-caption-2 font-semibold px-2 py-0.5 tracking-wide animate-pulse">
                                              Novidade
                                            </span>
                                          )}
                                          {child.href ===
                                            "/dashboard/corrigir" &&
                                            pendingCount > 0 && (
                                              <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium px-1.5 shadow-sm border border-orange-200/20 animate-pulse">
                                                {pendingCount}
                                              </span>
                                            )}
                                        </span>
                                      </Link>
                                    </Button>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }
                      // Single link
                      const link = item;
                      const isActive =
                        pathname === link.href ||
                        pathname.startsWith(link.href + "/");
                      const disabled =
                        link.disabled || userSubscription?.plan === "trial";
                      return (
                        <div key={index}>
                          <Button
                            disabled={disabled}
                            size="default"
                            variant="plain"
                            className={cn(
                              "w-full justify-start gap-3 h-11 rounded-apple",
                              isActive && "bg-apple-blue/10 text-apple-blue",
                            )}
                            asChild
                          >
                            <Link
                              href={link.href}
                              className={cn(
                                "flex items-center gap-3 rounded-apple px-3 py-2 text-muted-foreground apple-transition hover:text-foreground",
                                disabled && "opacity-50 cursor-not-allowed",
                              )}
                            >
                              {link.icon}
                              <span className="flex items-center gap-2">
                                {link.title}
                                {link.isNew && (
                                  <span className="inline-flex items-center rounded-full bg-apple-red text-white text-caption-2 font-semibold px-2 py-0.5 tracking-wide animate-pulse">
                                    Novidade
                                  </span>
                                )}
                                {link.href === "/dashboard/corrigir" &&
                                  pendingCount > 0 && (
                                    <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium px-1.5 shadow-sm border border-orange-200/20 animate-pulse">
                                      {pendingCount}
                                    </span>
                                  )}
                              </span>
                            </Link>
                          </Button>
                        </div>
                      );
                    }))}
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
                              "shadow-none dark:text-[rgb(var(--apple-label))] text-[rgb(var(--apple-label))]",
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
                <div className="w-full flex justify-center items-center p-2 rounded-xl bg-[rgb(var(--apple-gray-6))] dark:bg-[rgb(var(--apple-gray-5))] hover:bg-[rgb(var(--apple-gray-5))] dark:hover:bg-[rgb(var(--apple-gray-4))] apple-transition-fast border border-[rgb(var(--apple-gray-4))] dark:border-[rgb(var(--apple-gray-4))]">
                  <UserButton
                    showName={true}
                    appearance={{
                      elements: {
                        userButtonTrigger:
                          "shadow-none text-[rgb(var(--apple-label))] dark:text-[rgb(var(--apple-label))] hover:text-[rgb(var(--apple-blue))] dark:hover:text-[rgb(var(--apple-blue))] apple-transition-fast",
                        button:
                          "shadow-none bg-transparent hover:bg-transparent",
                        userButtonBox: "gap-2",
                        userButtonOuterBox: "gap-2",
                        avatarBox: "w-8 h-8",
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
