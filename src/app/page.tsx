"use client";

import Link from "next/link";
import { useProfile } from "@/context/ProfileContext";
import {
  Rocket,
  UserCircle,
  Brain,
  Target,
  Cog,
  Crown,
  Zap,
  Mic,
  Presentation,
  ArrowRight,
  Check,
  Lock,
  RotateCcw,
} from "lucide-react";

const modules = [
  {
    href: "/onboarding",
    title: "தொடக்கம்",
    description: "நீங்கள் யாருக்கு உதவுகிறீர்கள், என்ன மாற்றம் செய்கிறீர்கள் என்று சொல்லுங்கள். 3 சின்ன கேள்விகள் — மீதி ஞானி build செய்யும்.",
    icon: Rocket,
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    profileKey: "onboarding",
    number: "00",
  },
  {
    href: "/icp-builder",
    title: "கனவு Client Profile",
    description: "உங்கள் ideal client-ஐ முழுமையாக உருவாக்கும் — பெயர், முகம், India-grounded real details எல்லாம்.",
    icon: UserCircle,
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    profileKey: "icp",
    number: "01",
  },
  {
    href: "/xray-brain",
    title: "மன ஆராய்ச்சி",
    description: "Client-ன் மனநிலையை ஆழமாக map செய்யும். பயம், ஆசை, எதிர்ப்புகள், raw soundbites — எல்லாம்.",
    icon: Brain,
    gradient: "linear-gradient(135deg, #ec4899, #f97316)",
    profileKey: "mind_xray",
    number: "02",
  },
  {
    href: "/problem-finder",
    title: "High-Impact பிரச்சனைகள்",
    description: "Premium-க்கு மக்கள் பணம் கொடுக்கும் 10 பிரச்சனைகள். Real ₹ cost-of-inaction numbers-உடன்.",
    icon: Target,
    gradient: "linear-gradient(135deg, #10b981, #22d3ee)",
    profileKey: "high_impact",
    number: "03",
  },
  {
    href: "/mechanism-builder",
    title: "Unique Mechanism",
    description: "உங்கள் method-க்கு பெயர் வைக்கும், framework build செய்யும், positioning line கொடுக்கும்.",
    icon: Cog,
    gradient: "linear-gradient(135deg, #f97316, #d4a853)",
    profileKey: "mechanism",
    number: "04",
  },
  {
    href: "/godfather-offer",
    title: "மறுக்க முடியாத Offer",
    description: "இல்லை என்று சொல்ல முடியாத offer. Story-first, salesy இல்லை. இது suite-ன் இதயம்.",
    icon: Crown,
    gradient: "linear-gradient(135deg, #d4a853, #f0c75e)",
    profileKey: "offer",
    number: "05",
  },
  {
    href: "/hook-builder",
    title: "Hooks & Headlines",
    description: "10 bold-but-believable hooks with win-rates. Meta ads, Instagram, WhatsApp, webinars-க்கு ready.",
    icon: Zap,
    gradient: "linear-gradient(135deg, #3b82f6, #10b981)",
    profileKey: "hooks",
    number: "06",
  },
  {
    href: "/pitch-builder",
    title: "Pitch உருவாக்கு",
    description: "Ready-to-use pitch — DMs, sales calls, stage, written proposals-க்கு adapt செய்யப்பட்டது.",
    icon: Mic,
    gradient: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
    profileKey: "pitch",
    number: "07",
  },
  {
    href: "/deck-generator",
    title: "Deck உருவாக்கு",
    description: "Slide-by-slide outline with speaker notes. ஒவ்வொரு slide-லும் என்ன சொல்ல வேண்டும் — exactly.",
    icon: Presentation,
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    profileKey: "deck",
    number: "08",
  },
];

export default function Dashboard() {
  const { profile, isLoaded, reset } = useProfile();

  const isCompleted = (key: string) => {
    if (!isLoaded) return false;
    const mod = profile[key as keyof typeof profile];
    return mod && typeof mod === "object" && "completed" in mod && (mod as { completed: boolean }).completed;
  };

  const nextIndex = modules.findIndex((m) => !isCompleted(m.profileKey));
  const coachName = isLoaded ? profile.coach.name : "";

  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* Hero */}
      <div className="mb-10">
        {/* Brand badge */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="gnani-logo" style={{ width: 28, height: 28 }}>
            <div className="gnani-ring gnani-ring-outer" />
            <div className="gnani-ring gnani-ring-inner" />
            <span className="gnani-letter" style={{ fontSize: "0.65rem" }}>ஞா</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent-gold">
            Intelligent Coaching Engine
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-text-primary leading-tight">
          {coachName ? (
            <>
              வணக்கம் <span className="shimmer-text">{coachName}</span>,{" "}
              உங்கள் coaching business-ஐ கட்டமைப்போம்
            </>
          ) : (
            <>
              <span className="shimmer-text">ஞானி</span> — உங்கள் Coaching Business-ஐ கட்டமைக்கும் AI
            </>
          )}
        </h1>
        <p className="text-text-secondary text-sm max-w-2xl leading-relaxed">
          Sasi Rekha-வின் coaching methodology + AI ஆராய்ச்சி. சில கேள்விகளுக்கு பதில் சொல்லுங்கள்
          — 9 படிகளில் பூஜ்ஜியத்தில் இருந்து முழுமையான offer, hooks, pitch, deck வரை கொண்டு போகும்.
        </p>
      </div>

      {/* Flow indicator */}
      <div className="flex items-center gap-1.5 mb-8 flex-wrap">
        {modules.map((mod, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isCompleted(mod.profileKey)
                  ? "bg-accent-green/10 text-accent-green"
                  : i === nextIndex
                  ? "bg-accent-gold/10 text-accent-gold"
                  : "bg-bg-card text-text-secondary/30"
              }`}
            >
              {isCompleted(mod.profileKey) ? (
                <Check size={9} />
              ) : (
                <span className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold border border-current/30">
                  {i}
                </span>
              )}
              <span className="hidden sm:inline">{mod.title.split(" ")[0]}</span>
            </div>
            {i < modules.length - 1 && (
              <ArrowRight size={8} className="text-border-default" />
            )}
          </div>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          const completed = isCompleted(mod.profileKey);
          const isNext = i === nextIndex;
          const isLocked = !completed && i > 0 && !isCompleted(modules[i - 1].profileKey) && i !== nextIndex;

          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={`module-card group relative glass-card rounded-xl p-5 ${
                completed ? "completed" : isNext ? "next" : isLocked ? "locked" : ""
              }`}
            >
              {/* Background number */}
              <span className="absolute top-3 right-4 text-3xl font-black text-text-secondary/5 select-none">
                {mod.number}
              </span>

              {/* Status badge */}
              {completed && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent-green/20 flex items-center justify-center">
                  <Check size={12} className="text-accent-green" />
                </div>
              )}
              {isLocked && (
                <div className="absolute top-3 right-3">
                  <Lock size={13} className="text-text-secondary/20" />
                </div>
              )}

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-3"
                style={{ background: mod.gradient }}
              >
                <Icon size={18} />
              </div>

              <h3 className="text-sm font-bold text-text-primary mb-1 group-hover:text-white transition-colors">
                {mod.title}
              </h3>
              <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                {mod.description}
              </p>

              {/* CTA */}
              <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-gold group-hover:gap-3 transition-all">
                {completed ? "பார் / மீண்டும்" : isNext ? "இங்கே தொடங்கு" : "வரும்போது..."}
                <ArrowRight size={11} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Reset */}
      {isLoaded && profile.onboarding.completed && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={async () => {
              if (confirm("இது உங்கள் எல்லா data-வையும் அழித்து புதிதாக தொடங்கும். உறுதியா?")) {
                await reset();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 text-[10px] text-text-secondary/30 hover:text-accent-red transition-colors"
          >
            <RotateCcw size={11} /> புதிதாக தொடங்கு (எல்லா data-வும் reset)
          </button>
        </div>
      )}
    </div>
  );
}
