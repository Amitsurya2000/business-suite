"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Mail, Lock, User } from "lucide-react";

type Mode = "signin" | "signup" | "verify";

export function AuthScreen() {
  const { signIn, signInWithGoogle, signUp, verifyEmail, resendCode } = useAuth();

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

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error } = await signInWithGoogle();
    // On success the browser redirects to Google, so we only land here on error.
    if (error) {
      setError(error);
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

          {/* Google sign-in */}
          {mode !== "verify" && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border-default" />
                <span className="text-[10px] text-text-secondary/50 uppercase tracking-wider">
                  அல்லது
                </span>
                <div className="flex-1 h-px bg-border-default" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg py-2.5 text-sm font-medium bg-bg-card border border-border-default text-text-primary hover:border-accent-gold/40 disabled:opacity-60 transition-colors"
              >
                <GoogleIcon />
                Google-உடன் தொடரவும்
              </button>
            </>
          )}

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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
