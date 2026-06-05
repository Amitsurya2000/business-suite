"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { insforge } from "@/lib/insforge";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  // Returns needsVerification=true when a 6-digit code was emailed.
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string; needsVerification?: boolean }>;
  verifyEmail: (email: string, otp: string) => Promise<{ error?: string }>;
  resendCode: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as { id?: string; email?: string; name?: string };
  if (!u.id || !u.email) return null;
  return { id: u.id, email: u.email, name: u.name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on cold load (uses the httpOnly refresh cookie).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (cancelled) return;
      setUser(error ? null : readUser(data?.user));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message || "உள்நுழைய முடியவில்லை" };
    setUser(readUser(data?.user));
    return {};
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { data, error } = await insforge.auth.signUp({
        email,
        password,
        name,
      });
      if (error) return { error: error.message || "பதிவு செய்ய முடியவில்லை" };
      if (data?.requireEmailVerification) return { needsVerification: true };
      // No verification required — already signed in.
      setUser(readUser(data?.user));
      return {};
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) return { error: error.message || "Code தவறு அல்லது காலாவதி" };
    // verifyEmail saves the session automatically.
    setUser(readUser(data?.user));
    return {};
  }, []);

  const resendCode = useCallback(async (email: string) => {
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) return { error: error.message || "மீண்டும் அனுப்ப முடியவில்லை" };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await insforge.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, verifyEmail, resendCode, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
