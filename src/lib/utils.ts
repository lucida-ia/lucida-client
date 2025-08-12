import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImpersonateUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("impersonateUserId");
}
