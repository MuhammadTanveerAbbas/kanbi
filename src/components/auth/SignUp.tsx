"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField, AuthButton, SocialAuth, getPasswordStrength } from "@/components/auth/AuthComponents";

const I = {
  spark: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" /></svg>,
  zap: (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  user: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  mail: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  lock: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  shield: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  check: (s = 10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
  send: (s = 24) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
  back: (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
};

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const strength = password ? getPasswordStrength(password) : { score: 0, label: "", color: "var(--br)" };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    if (!agreed) e.agreed = "Please accept the terms to continue";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div style={{ padding: "40px 28px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gr)", margin: "0 auto 18px" }}>
            {I.send()}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--tx)", marginBottom: 10 }}>Check your email</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx2)", lineHeight: 1.65, marginBottom: 6, maxWidth: 320, margin: "0 auto 10px" }}>
            We sent a confirmation link to <strong style={{ color: "var(--tx)" }}>{email}</strong>. Click it to activate your account.
          </p>
          <p style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 24 }}>Didn't receive it? Check your spam folder.</p>
          <AuthButton variant="ghost" icon={I.back()} onClick={() => router.push("/sign-in")} type="button">
            Back to Sign In
          </AuthButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div style={{ padding: "28px 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac)", margin: "0 auto 13px" }}>
            {I.spark()}
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)", marginBottom: 5 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: "var(--tx2)" }}>Start saving 2 hours every day — free forever</p>
        </div>

        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
          {["Free plan included", "Groq AI powered", "No credit card"].map(f => (
            <span key={f} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 100, background: "var(--as)", border: "1px solid var(--ag)", color: "var(--ac)", fontWeight: 500 }}>{f}</span>
          ))}
        </div>

        <SocialAuth mode="signup" />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AuthField
            label="Full Name" value={name} onChange={setName}
            placeholder="Muhammad Tanveer Abbas" error={errors.name}
            icon={I.user(14)} autoComplete="name" required
          />
          <AuthField
            label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" error={errors.email}
            icon={I.mail(14)} autoComplete="email" required
          />
          <div>
            <AuthField
              label="Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword}
              placeholder="Create a strong password" error={errors.password}
              icon={I.lock(14)} autoComplete="new-password" required
              showPassword={showPw} onTogglePassword={() => setShowPw(v => !v)}
            />
            {password.length > 0 && (
              <div style={{ marginTop: 7 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= strength.score ? strength.color : "var(--br)", transition: "width .3s, background .3s" }} />
                  ))}
                </div>
                {strength.label && <p style={{ fontSize: 11, color: strength.color }}>{strength.label}</p>}
              </div>
            )}
          </div>
          <AuthField
            label="Confirm Password" type={showCon ? "text" : "password"} value={confirm} onChange={setConfirm}
            placeholder="Repeat your password" error={errors.confirm}
            icon={I.shield(14)} autoComplete="new-password" required
            showPassword={showCon} onTogglePassword={() => setShowCon(v => !v)}
          />

          <div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <div onClick={() => setAgreed(v => !v)} style={{
                width: 17, height: 17, borderRadius: 5, marginTop: 1, flexShrink: 0,
                border: `1px solid ${agreed ? "var(--ac)" : errors.agreed ? "var(--rd)" : "var(--br)"}`,
                background: agreed ? "var(--ac)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .15s",
              }}>
                {agreed && I.check()}
              </div>
              <span style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.55 }}>
                I agree to the{" "}
                <a href="/terms" style={{ color: "var(--ac)" }}>Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" style={{ color: "var(--ac)" }}>Privacy Policy</a>
              </span>
            </label>
            {errors.agreed && <p style={{ fontSize: 11.5, color: "var(--rd)", marginTop: 5 }}>⚠ {errors.agreed}</p>}
          </div>

          {errors.general && <p style={{ fontSize: 12, color: "var(--rd)", textAlign: "center" }}>⚠ {errors.general}</p>}

          <AuthButton loading={loading} icon={I.zap()}>
            Create Free Account
          </AuthButton>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--br)", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--tx2)" }}>
            Already have an account?{" "}
            <a href="/sign-in" style={{ color: "var(--ac)", fontWeight: 600, cursor: "pointer", transition: "opacity .15s" }} onMouseOver={e => e.currentTarget.style.opacity = ".75"} onMouseOut={e => e.currentTarget.style.opacity = "1"}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
