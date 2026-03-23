"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField, AuthButton } from "@/components/auth/AuthComponents";

const I = {
  lock: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  mail: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  send: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
  back: (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div style={{ padding: "40px 28px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gr)", margin: "0 auto 18px" }}>
            {I.send(24)}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--tx)", marginBottom: 10 }}>Reset link sent</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx2)", lineHeight: 1.65, marginBottom: 8, maxWidth: 300, margin: "0 auto 10px" }}>
            We sent a password reset link to <strong style={{ color: "var(--tx)" }}>{email}</strong>.
          </p>
          <p style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 26 }}>Link expires in 1 hour. Check your spam folder if needed.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 240, margin: "0 auto" }}>
            <AuthButton variant="ghost" onClick={() => { setSent(false); setEmail(""); }} type="button">
              Resend reset email
            </AuthButton>
            <button onClick={() => router.push("/sign-in")} style={{ fontSize: 13, color: "var(--tx2)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {I.back()} Back to Sign In
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div style={{ padding: "32px 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac)", margin: "0 auto 13px" }}>
            {I.lock()}
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)", marginBottom: 6 }}>Forgot your password?</h1>
          <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AuthField
            label="Email address" type="email" value={email} onChange={v => { setEmail(v); setError(""); }}
            placeholder="you@example.com" error={error}
            icon={I.mail(14)} autoComplete="email" required
          />
          <AuthButton loading={loading} icon={I.send(14)}>
            Send Reset Link
          </AuthButton>
        </form>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--br)", textAlign: "center" }}>
          <button onClick={() => router.push("/sign-in")} style={{ fontSize: 13, color: "var(--tx2)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "0 auto" }}>
            {I.back()} Back to Sign In
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
