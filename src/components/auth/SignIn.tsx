"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField, AuthButton, SocialAuth } from "@/components/auth/AuthComponents";
import { ErrorNotice } from "@/components/error-notice";

const I = {
  zap: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  arrow: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
  mail: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  lock: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  check: (s = 10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
};

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remember, setRemember] = useState(false);

  // Surface an error forwarded by the OAuth callback (for example when the
  // provider denies access). Read during render so the message is present on the
  // first paint instead of appearing a frame later.
  const oauthError = searchParams.get("error");
  const [shownOAuthError, setShownOAuthError] = useState<string | null>(null);
  if (oauthError && oauthError !== shownOAuthError) {
    setShownOAuthError(oauthError);
    setErrors({ general: decodeURIComponent(oauthError) });
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            <img src="/Kanbi.png" alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: 10, display: "block", flexShrink: 0 }} />
            <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--tx)", lineHeight: 1 }}>kanbi</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--tx3)", margin: "0 0 8px", textAlign: "center" }}>Your private task board.</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--tx)", marginBottom: 7 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5 }}>Use your Kanbi account to continue</p>
        </div>

        <SocialAuth mode="signin" />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AuthField
            label="Email" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" error={errors.email}
            icon={I.mail(14)} autoComplete="email" required
          />
          <AuthField
            label="Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword}
            placeholder="Enter your password" error={errors.password}
            icon={I.lock(14)} autoComplete="current-password" required
            showPassword={showPw} onTogglePassword={() => setShowPw(v => !v)}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", position: "relative" }}>
              <input
                type="checkbox"
                className="auth-check"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span className="auth-box" aria-hidden="true" style={{
                width: 16, height: 16, borderRadius: 4, border: `1px solid ${remember ? "#fff" : "var(--br)"}`, color: remember ? "#000" : "var(--tx2)",
                background: remember ? "#fff" : "transparent", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .15s,background .15s",
              }}>
                {remember && I.check()}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--tx2)" }}>Remember me</span>
            </label>
            <a href="/forgot" style={{ fontSize: 13, color: "var(--ac-text)", cursor: "pointer", transition: "opacity .15s" }} onMouseOver={e => e.currentTarget.style.opacity = ".75"} onMouseOut={e => e.currentTarget.style.opacity = "1"}>
              Forgot password?
            </a>
          </div>

          {errors.general && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ErrorNotice variant="inline">{errors.general}</ErrorNotice>
            </div>
          )}

          <AuthButton loading={loading} icon={I.arrow(14)}>
            Sign In
          </AuthButton>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--br)", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--tx2)" }}>
            Don&rsquo;t have an account?{" "}
            <a href="/sign-up" style={{ color: "var(--ac-text)", fontWeight: 600, cursor: "pointer", transition: "opacity .15s" }} onMouseOver={e => e.currentTarget.style.opacity = ".75"} onMouseOut={e => e.currentTarget.style.opacity = "1"}>
              Sign up free
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
