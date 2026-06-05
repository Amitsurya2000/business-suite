"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { completedCount } from "@/lib/profile";
import {
  LayoutDashboard,
  Rocket,
  UserCircle,
  Brain,
  Target,
  Cog,
  Crown,
  Zap,
  Mic,
  Presentation,
  Check,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "முகப்பு", icon: LayoutDashboard, moduleKey: null },
  { href: "/onboarding", label: "தொடக்கம்", icon: Rocket, moduleKey: "onboarding" },
  { href: "/icp-builder", label: "கனவு Client", icon: UserCircle, moduleKey: "icp" },
  { href: "/xray-brain", label: "மன ஆராய்ச்சி", icon: Brain, moduleKey: "mind_xray" },
  { href: "/problem-finder", label: "பிரச்சனை கண்டுபிடி", icon: Target, moduleKey: "high_impact" },
  { href: "/mechanism-builder", label: "Mechanism கட்ட", icon: Cog, moduleKey: "mechanism" },
  { href: "/godfather-offer", label: "மறுக்க முடியாத Offer", icon: Crown, moduleKey: "offer" },
  { href: "/hook-builder", label: "Hooks & Headlines", icon: Zap, moduleKey: "hooks" },
  { href: "/pitch-builder", label: "Pitch உருவாக்கு", icon: Mic, moduleKey: "pitch" },
  { href: "/deck-generator", label: "Deck உருவாக்கு", icon: Presentation, moduleKey: "deck" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isLoaded } = useProfile();
  const { user, signOut } = useAuth();
  const done = isLoaded ? completedCount(profile) : 0;

  const isCompleted = (moduleKey: string | null) => {
    if (!moduleKey || !isLoaded) return false;
    const mod = profile[moduleKey as keyof typeof profile];
    return mod && typeof mod === "object" && "completed" in mod && (mod as { completed: boolean }).completed;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-secondary/80 backdrop-blur-xl border-r border-border-default flex flex-col z-50">
      {/* Brand Logo */}
      <div className="p-5 border-b border-border-default">
        <Link href="/" className="flex items-center gap-3">
          <div className="gnani-logo">
            <div className="gnani-ring gnani-ring-outer" />
            <div className="gnani-ring gnani-ring-inner" />
            <span className="gnani-letter">ஞா</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary leading-tight tracking-tight">
              <span className="gradient-text-gold">ஞானி</span>
            </h1>
            <p className="text-[10px] text-text-secondary tracking-wider uppercase">
              by Sasi Rekha
            </p>
          </div>
        </Link>
      </div>

      {/* Coach greeting */}
      {isLoaded && profile.coach.name && (
        <div className="px-5 py-3 border-b border-border-default">
          <p className="text-xs text-text-secondary">
            வணக்கம், <span className="text-accent-gold font-medium">{profile.coach.name}</span>
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          const completed = isCompleted(item.moduleKey);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.moduleKey && completed && (
                <Check size={13} className="text-accent-green flex-shrink-0" />
              )}
              {item.moduleKey && !completed && i > 1 && (
                <span className="text-[10px] text-text-secondary/40 flex-shrink-0">
                  {String(i).padStart(2, "0")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Progress */}
      <div className="p-4 border-t border-border-default">
        <div className="glass-card p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] text-text-secondary uppercase tracking-wider">முன்னேற்றம்</p>
            <p className="text-xs font-bold text-accent-gold">{done}/9</p>
          </div>
          {/* Segmented progress */}
          <div className="flex gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: i < done
                    ? "linear-gradient(90deg, var(--accent-gold), var(--accent-amber))"
                    : "rgba(100, 100, 200, 0.08)",
                }}
              />
            ))}
          </div>
          {done === 9 && (
            <p className="text-[10px] text-accent-green font-medium mt-2 tracking-wider">
              எல்லா modules-ம் முடிந்தது!
            </p>
          )}
        </div>
      </div>

      {/* Account */}
      {user && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-accent-gold/15 flex items-center justify-center text-accent-gold text-xs font-bold flex-shrink-0">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <p className="flex-1 truncate text-[11px] text-text-secondary" title={user.email}>
              {user.email}
            </p>
            <button
              onClick={() => signOut()}
              title="வெளியேறு"
              className="text-text-secondary/50 hover:text-accent-red transition-colors flex-shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
