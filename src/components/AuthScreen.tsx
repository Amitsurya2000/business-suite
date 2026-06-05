"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Mail, Lock, User } from "lucide-react";

type Mode = "signin" | "signup" | "verify";

export function AuthScreen() {
  const { signIn, signUp, verifyEmail, resendCode } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else if (mode === "signup") {
        const { error, needsVerification } = await signUp(email, password, name);
        if (error) setError(error);
        else if (needsVerification) {
          setMode("verify");
          setNotice("உங்கள் email-க்கு 6-இலக்க code அனுப்பப்பட்டது.");
        }
      } else if (mode === "verify") {
        const { error } = await verifyEmail(email, otp);
        if (error) setError(error);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    const { error } = await resendCode(email);
    if (error) setError(error);
    else setNotice("Code மீண்டும் அனுப்பப்பட்டது.");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-bg-primary">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="gnani-logo" style={{ width: 56, height: 56 }}>
            <div className="gnani-ring gnani-ring-outer" />
            <div className="gnani-ring gnani-ring-inner" />
            <span className="gnani-letter" style={{ fontSize: "1.3rem" }}>
              ஞா
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold">
            <span className="gradient-text-gold">ஞானி</span>
          </h1>
          <p className="text-[11px] text-text-secondary uppercase tracking-[0.15em] mt-1">
            Intelligent Coaching Engine
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-1 text-text-primary">
            {mode === "signin"
              ? "மீண்டும் வரவேற்கிறோம்"
              : mode === "signup"
              ? "புதிய கணக்கு உருவாக்கு"
              : "Email-ஐ உறுதிப்படுத்து"}
          </h2>
          <p className="text-xs text-text-secondary mb-5">
            {mode === "signin"
              ? "உங்கள் coaching business-ஐ தொடர உள்நுழையுங்கள்."
              : mode === "signup"
              ? "சில விநாடிகளில் தொடங்குங்கள்."
              : `${email}-க்கு அனுப்பிய code-ஐ உள்ளிடவும்.`}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field
                icon={<User size={15} />}
                type="text"
                placeholder="உங்கள் பெயர்"
                value={name}
                onChange={setName}
                required
              />
            )}

            {mode !== "verify" && (
              <>
                <Field
                  icon={<Mail size={15} />}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={setEmail}
                  required
                />
                <Field
                  icon={<Lock size={15} />}
                  type="password"
                  placeholder="Password (குறைந்தது 6 எழுத்து)"
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={6}
                />
              </>
            )}

            {mode === "verify" && (
              <Field
                icon={<Lock size={15} />}
                type="text"
                placeholder="6-இலக்க code"
                value={otp}
                onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                required
              />
            )}

            {error && (
              <p className="text-xs text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-xs text-accent-green bg-accent-green/10 rounded-lg px-3 py-2">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-bg-primary disabled:opacity-60 transition-opacity"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent-gold), var(--accent-amber))",
              }}
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === "signin"
                ? "உள்நுழை"
                : mode === "signup"
                ? "கணக்கு உருவாக்கு"
                : "உறுதிப்படுத்து"}
            </button>
          </form>

          {/* Footer switches */}
          <div className="mt-5 text-center text-xs text-text-secondary">
            {mode === "signin" && (
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setNotice(null);
                }}
                className="hover:text-accent-gold transition-colors"
              >
                கணக்கு இல்லையா?{" "}
                <span className="text-accent-gold font-medium">பதிவு செய்</span>
              </button>
            )}
            {mode === "signup" && (
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setNotice(null);
                }}
                className="hover:text-accent-gold transition-colors"
              >
                ஏற்கனவே கணக்கு உள்ளதா?{" "}
                <span className="text-accent-gold font-medium">உள்நுழை</span>
              </button>
            )}
            {mode === "verify" && (
              <div className="space-y-2">
                <button
                  onClick={handleResend}
                  className="hover:text-accent-gold transition-colors block w-full"
                >
                  Code வரவில்லையா?{" "}
                  <span className="text-accent-gold font-medium">
                    மீண்டும் அனுப்பு
                  </span>
                </button>
                <button
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setNotice(null);
                  }}
                  className="hover:text-text-primary transition-colors text-text-secondary/60"
                >
                  ← திரும்பு
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
}: {
  icon: ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full rounded-lg bg-bg-card border border-border-default pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-gold/50 transition-colors"
      />
    </div>
  );
}
