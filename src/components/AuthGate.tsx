"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { Loader2 } from "lucide-react";

// Gates the whole app behind authentication. Children (sidebar + modules) only
// mount once a user session exists, so everything inside can assume a user.
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-primary">
        <Loader2 size={28} className="animate-spin text-accent-gold" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <>{children}</>;
}
