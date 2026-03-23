"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthField, AuthButton, getPasswordStrength } from "@/components/auth/AuthComponents";

const I = {
  shield: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  lock: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  check: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
  arrow: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = password ? getPasswordStrength(password) : { score: 0, label: "", color: "var(--br)" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "At least 8 characters";
    if (password !== confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div style={{ padding: "40px 28px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gr)", margin: "0 auto 18px" }}>
            {I.check(26)}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--tx)", marginBottom: 10 }}>Password updated!</h2>
          <p style={{ fontSize: 13.5, color: "var(--tx2)", lineHeight: 1.65, marginBottom: 24 }}>Your password has been reset. You can now sign in with your new password.</p>
          <AuthButton icon={I.arrow()} onClick={() => router.push("/sign-in")} type="button">
            Sign In
          </AuthButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div style={{ padding: "32px 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--as)", border: "1px solid var(--ag)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ac)", margin: "0 auto 13px" }}>
            {I.shield()}
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.035em", color: "var(--tx)", marginBottom: 6 }}>Set new password</h1>
          <p style={{ fontSize: 13, color: "var(--tx2)" }}>Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <AuthField
              label="New Password" type={showPw ? "text" : "password"} value={password} onChange={setPassword}
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
            placeholder="Repeat new password" error={errors.confirm}
            icon={I.shield(14)} autoComplete="new-password" required
            showPassword={showCon} onTogglePassword={() => setShowCon(v => !v)}
          />

          {errors.general && <p style={{ fontSize: 12, color: "var(--rd)", textAlign: "center" }}>⚠ {errors.general}</p>}

          <AuthButton loading={loading} icon={I.check(14)}>
            Update Password
          </AuthButton>
        </form>
      </div>
    </AuthLayout>
  );
}
