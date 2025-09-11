import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImpersonateUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("impersonateUserId");
}

/**
 * Checks if a trial user is past one week from their creation date
 * @param user The user object with subscription and createdAt information
 * @returns true if user is trial and past one week, false otherwise
 */
export function isTrialUserPastOneWeek(user: any): boolean {
  if (!user || user.subscription?.plan !== "trial") {
    return false;
  }

  const createdAt = new Date(user.createdAt);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return createdAt < oneWeekAgo;
}
