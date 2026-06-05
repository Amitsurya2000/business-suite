"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ArrowLeft, Loader2, RefreshCw, Check, ChevronRight, Sparkles, Lock, Copy } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/context/ProfileContext";

export interface QuestionDef {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

interface ModuleFlowProps {
  moduleId: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentGradient: string;
  questions: QuestionDef[];
  twoPass?: boolean;
  locked?: boolean;
  lockMessage?: string;
  existingOutput?: string;
  onSave: (output: string, answers: Record<string, string>) => void;
  children?: (output: string) => ReactNode;
}

// ======== JARVIS STEP DEFINITIONS ========
const JARVIS_STEPS: Record<string, { research?: string[]; generate: string[] }> = {
  icp: {
    research: [
      "India coaching market database scan...",
      "Demographics & income band data ஆராய்ச்சி...",
      "Competitor coaching packages & pricing analyze...",
      "Online behavior & platform pattern map...",
      "Client language & real pain points collect...",
      "Market data cross-reference & validate...",
    ],
    generate: [
      "Sasi Rekha coaching methodology load...",
      "Ideal client persona sculpt...",
      "India context & real ₹ data inject...",
      "Tamil voice layer apply...",
      "Final persona output quality polish...",
    ],
  },
  mind_xray: {
    research: [
      "Psychology research database scan...",
      "Fear & desire pattern ஆராய்ச்சி...",
      "Buying objection data analyze...",
      "Emotional trigger deep map...",
      "Real soundbite & language pattern collect...",
      "Psychology data validate & compile...",
    ],
    generate: [
      "Deep psychology X-Ray profile build...",
      "Emotion & fear layer structure...",
      "Real-voice soundbite craft...",
      "India context ground & verify...",
      "Final X-Ray output quality polish...",
    ],
  },
  high_impact: {
    research: [
      "India salary & career growth data scan...",
      "Cost-of-inaction calculation ஆராய்ச்சி...",
      "Competitor pricing intelligence collect...",
      "Real opportunity cost data analyze...",
      "Market size indicator map...",
      "Problem impact data validate & compile...",
    ],
    generate: [
      "High-impact problem identify & rank...",
      "₹ impact quantify with real data...",
      "Transformation roadmap build...",
      "India context ground & verify...",
      "Final analysis output quality polish...",
    ],
  },
  mechanism: {
    generate: [
      "Framework architecture design...",
      "Brandable mechanism name brainstorm...",
      "Positioning statement craft...",
      "Competitor differentiation analyze...",
      "India coaching market context ground...",
      "Final mechanism output quality polish...",
    ],
  },
  offer: {
    generate: [
      "Offer story arc build...",
      "Value stack design & frame...",
      "Price anchor with cost-of-inaction...",
      "Risk reversal strategy craft...",
      "Urgency & timing frame...",
      "Final offer output quality polish...",
    ],
  },
  hooks: {
    generate: [
      "Hook psychology pattern analyze...",
      "Platform-specific format optimize...",
      "10 headline variation generate...",
      "Win-rate estimate calculate...",
      "India audience language tune...",
      "Final hooks output quality polish...",
    ],
  },
  pitch: {
    generate: [
      "Narrative arc structure design...",
      "Channel-specific format adapt...",
      "Objection handling script build...",
      "Conversation flow map...",
      "Tamil voice & tone layer apply...",
      "Final pitch output quality polish...",
    ],
  },
  deck: {
    generate: [
      "Slide structure & flow plan...",
      "Content per-slide map...",
      "Speaker notes script write...",
      "Visual guidance add...",
      "Presentation narrative optimize...",
      "Final deck output quality polish...",
    ],
  },
};

function getSteps(moduleId: string, twoPass: boolean) {
  const mod = JARVIS_STEPS[moduleId] || { generate: ["Output உருவாக்குகிறேன்..."] };
  const research = twoPass && mod.research ? mod.research : [];
  const generate = mod.generate;
  return [...research, ...generate];
}

// ======== API CALL ========
async function callAPI(
  module: string,
  phase: string,
  profile: unknown,
  answers: Record<string, string>,
  researchData?: string
) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, phase, profile, answers, researchData }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Generation failed");
  }
  return res.json();
}

// ======== COMPONENT ========
export function ModuleFlow({
  moduleId,
  title,
  subtitle,
  icon,
  accentGradient,
  questions,
  twoPass = false,
  locked = false,
  lockMessage,
  existingOutput,
  onSave,
  children,
}: ModuleFlowProps) {
  type Phase = "ask" | "reflect" | "generating" | "output";
  const [phase, setPhase] = useState<Phase>(existingOutput ? "output" : "ask");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState("");
  const [output, setOutput] = useState(existingOutput || "");
  const [error, setError] = useState("");
  // Profile comes from the shared (InsForge-backed) context — never null.
  const { profile } = useProfile();
  const [copied, setCopied] = useState(false);

  // Jarvis terminal state
  const [animSteps, setAnimSteps] = useState<{ text: string; status: "pending" | "active" | "done" }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const stepIndexRef = useRef(0);

  // Elapsed time counter during generating phase
  useEffect(() => {
    if (phase === "generating") {
      setElapsed(0);
      elapsedTimerRef.current = setInterval(() => setElapsed((p) => p + 0.1), 100);
    } else {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [phase]);

  // Cleanup step timer on unmount
  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  const updateAnswer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const allFilled = questions.every((q) => (answers[q.id] || "").trim().length > 0);

  // Compute progress percent from animSteps
  const doneCount = animSteps.filter((s) => s.status === "done").length;
  const progressPercent = animSteps.length > 0 ? Math.round((doneCount / animSteps.length) * 100) : 0;

  // Determine current phase label
  const stepsConfig = JARVIS_STEPS[moduleId];
  const researchLen = twoPass && stepsConfig?.research ? stepsConfig.research.length : 0;
  const isResearching = stepIndexRef.current < researchLen;

  // -------- HANDLERS --------

  const startAnimation = () => {
    const allStepTexts = getSteps(moduleId, twoPass);
    setAnimSteps(allStepTexts.map((text) => ({ text, status: "pending" as const })));
    stepIndexRef.current = 0;

    // Reveal first step immediately
    setAnimSteps((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: "active" } : s))
    );

    stepTimerRef.current = setInterval(() => {
      stepIndexRef.current++;
      const idx = stepIndexRef.current;
      setAnimSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < idx ? "done" : i === idx ? "active" : "pending",
        }))
      );
      if (idx >= allStepTexts.length - 1) {
        // Keep last step as active until API returns
        if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      }
    }, 2200);
  };

  const completeAllSteps = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    setAnimSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
  };

  const handleSubmit = async () => {
    if (!allFilled) return;
    setError("");
    setPhase("reflect");
    try {
      const { output: reflectText } = await callAPI(moduleId, "reflect", profile, answers);
      setReflection(reflectText);
    } catch {
      setReflection("புரிஞ்சுது — உங்கள் பதில்களை வைத்து build செய்கிறேன்.");
    }
  };

  const handleConfirmAndGenerate = async () => {
    setPhase("generating");
    setError("");
    startAnimation();

    try {
      let researchData: string | undefined;

      if (twoPass) {
        const { output: research } = await callAPI(moduleId, "research", profile, answers);
        researchData = research;

        // Jump research steps to done if animation is behind
        const rLen = stepsConfig?.research?.length || 0;
        if (stepIndexRef.current < rLen) {
          stepIndexRef.current = rLen;
          setAnimSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i < rLen ? "done" : i === rLen ? "active" : "pending",
            }))
          );
        }
      }

      const { output: generated } = await callAPI(moduleId, "generate", profile, answers, researchData);

      // Complete all steps
      completeAllSteps();

      // Dramatic pause to let the "all done" state show
      await new Promise((r) => setTimeout(r, 900));

      setOutput(generated);
      setPhase("output");
      onSave(generated, answers);
    } catch (e) {
      completeAllSteps();
      setError(e instanceof Error ? e.message : "ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.");
      setPhase("ask");
    }
  };

  const handleRegenerate = async () => {
    setPhase("generating");
    setOutput("");
    setError("");
    startAnimation();

    try {
      let researchData: string | undefined;
      if (twoPass) {
        const { output: research } = await callAPI(moduleId, "research", profile, answers);
        researchData = research;
        const rLen = stepsConfig?.research?.length || 0;
        if (stepIndexRef.current < rLen) {
          stepIndexRef.current = rLen;
          setAnimSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i < rLen ? "done" : i === rLen ? "active" : "pending",
            }))
          );
        }
      }
      const { output: generated } = await callAPI(moduleId, "generate", profile, answers, researchData);
      completeAllSteps();
      await new Promise((r) => setTimeout(r, 900));
      setOutput(generated);
      setPhase("output");
      onSave(generated, answers);
    } catch (e) {
      completeAllSteps();
      setError(e instanceof Error ? e.message : "ஏதோ தவறு ஏற்பட்டது.");
      setPhase("output");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -------- LOCKED STATE --------
  if (locked) {
    return (
      <div className="min-h-screen p-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
          <ArrowLeft size={16} /> முகப்புக்கு திரும்பு
        </Link>
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 opacity-40" style={{ background: accentGradient }}>
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">{title}</h2>
          <p className="text-text-secondary">{lockMessage || "முந்தைய modules-ஐ முதலில் முடிக்கவும்."}</p>
          <Link href="/" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105" style={{ background: accentGradient }}>
            முகப்புக்கு போ <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // -------- MAIN RENDER --------
  return (
    <div className="min-h-screen p-8 relative z-10">
      {/* Header */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> முகப்புக்கு திரும்பு
      </Link>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: accentGradient }}>
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="text-text-secondary text-sm">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* ======== PHASE: ASK ======== */}
        {phase === "ask" && (
          <div className="animate-fade-in-up space-y-6">
            {questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-text-primary mb-2">{q.label}</label>
                {q.type === "textarea" ? (
                  <textarea
                    rows={3}
                    placeholder={q.placeholder}
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                  />
                ) : q.type === "select" && q.options ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateAnswer(q.id, opt)}
                        className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                          answers[q.id] === opt
                            ? "border-accent-gold bg-accent-gold/10 text-accent-gold"
                            : "border-border-default bg-bg-secondary text-text-secondary hover:border-text-secondary"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={q.placeholder}
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: allFilled ? accentGradient : "#333" }}
            >
              <Sparkles size={16} />
              ஞானி-க்கு கொடுங்கள் — Build செய்யட்டும்
            </button>
          </div>
        )}

        {/* ======== PHASE: REFLECT ======== */}
        {phase === "reflect" && (
          <div className="animate-fade-in-up">
            {reflection ? (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-accent-gold tracking-wider">ஞானி புரிந்தது</span>
                  </div>
                  <p className="text-text-primary text-lg leading-relaxed">{reflection}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleConfirmAndGenerate}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: accentGradient }}
                  >
                    <Check size={16} /> சரி, build செய்யுங்கள்!
                  </button>
                  <button
                    onClick={() => { setPhase("ask"); setReflection(""); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-text-secondary glass-card hover:text-text-primary transition-all"
                  >
                    பதில்களை edit செய்ய வேண்டும்
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-text-secondary">
                <Loader2 size={20} className="animate-spin text-accent-gold" />
                <span className="text-sm">ஞானி உங்கள் பதில்களைப் புரிந்துகொள்கிறது...</span>
              </div>
            )}
          </div>
        )}

        {/* ======== PHASE: GENERATING (JARVIS TERMINAL) ======== */}
        {phase === "generating" && (
          <div className="animate-fade-in-up">
            <div className="jarvis-terminal">
              {/* Terminal Header */}
              <div className="jarvis-header">
                <div className="flex items-center gap-2.5">
                  <div className="jarvis-dot" />
                  <span className="text-xs font-mono tracking-wider" style={{ color: "var(--accent-cyan)" }}>
                    ஞானி AI — {isResearching ? "ஆராய்ச்சி" : "உருவாக்கம்"} செயல்படுகிறது
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  {elapsed.toFixed(1)}s
                </span>
              </div>

              {/* Central Orbiting Icon */}
              <div className="flex justify-center py-8">
                <div className="jarvis-core">
                  <div className="jarvis-ring jarvis-ring-1" />
                  <div className="jarvis-ring jarvis-ring-2" />
                  <div className="jarvis-ring jarvis-ring-3" />
                  <div className="jarvis-icon" style={{ background: accentGradient }}>
                    {icon}
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="jarvis-steps">
                {animSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`jarvis-step ${step.status}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <span className="jarvis-step-icon">
                      {step.status === "done" ? "✓" : step.status === "active" ? "◉" : "○"}
                    </span>
                    <span className="flex-1">
                      {step.text}
                      {step.status === "active" && <span className="jarvis-cursor">▋</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="jarvis-progress">
                <div className="jarvis-progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>

              {/* Footer */}
              <div className="jarvis-footer">
                <span>Powered by Sasi Rekha Methodology</span>
                <span>{progressPercent}% முடிந்தது</span>
              </div>
            </div>
          </div>
        )}

        {/* ======== PHASE: OUTPUT ======== */}
        {phase === "output" && output && (
          <div className="animate-fade-in-up space-y-6">
            {/* Output badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-accent-gold tracking-wider">
              <Check size={12} />
              <span>ஞானி AI — Output தயார்</span>
            </div>

            {children ? (
              children(output)
            ) : (
              <div className="glass-card p-8 prose-dark">
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(output) }} />
              </div>
            )}

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 text-sm text-accent-red">{error}</div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-border-default">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-text-secondary glass-card hover:text-text-primary transition-all"
              >
                <RefreshCw size={15} /> மீண்டும் உருவாக்கு
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-text-secondary glass-card hover:text-text-primary transition-all"
              >
                <Copy size={15} /> {copied ? "Copied!" : "Copy செய்"}
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 ml-auto"
                style={{ background: accentGradient }}
              >
                <Check size={15} /> முடிந்தது — அடுத்தது
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ======== MARKDOWN → HTML CONVERTER ========
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="list-decimal" value="$1">$2</li>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr />')
    .replace(/\n\n/g, '</p><p>');
}
