"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  subscription?: "basic" | "pro" | "enterprise" | null;
} | null;

type AuthContextType = {
  user: User;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock authentication for now - will be replaced with real auth
  useEffect(() => {
    // Simulate loading auth state
    setTimeout(() => {
      // Check localStorage for user data (simulating auth persistence)
      const storedUser = localStorage.getItem("lucida-user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real auth
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUser = {
        id: "1",
        name: "Test User",
        email,
        subscription: "basic" as const,
      };
      setUser(mockUser);
      localStorage.setItem("lucida-user", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real Google auth
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUser = {
        id: "2",
        name: "Google User",
        email: "google@example.com",
        image: "https://via.placeholder.com/150",
        subscription: "basic" as const,
      };
      setUser(mockUser);
      localStorage.setItem("lucida-user", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real auth
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUser = {
        id: "3",
        name,
        email,
        subscription: null,
      };
      setUser(mockUser);
      localStorage.setItem("lucida-user", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real auth
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser(null);
      localStorage.removeItem("lucida-user");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
