"use client";

import { useState } from "react";

const authFieldStyles = `
  .auth-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 9px;
    border: 1px solid var(--br);
    background: var(--inp);
    font-size: 14px;
    color: var(--tx);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .auth-input:focus {
    border-color: var(--ac);
    box-shadow: 0 0 0 3px var(--as);
  }
  .auth-input.error {
    border-color: var(--rd);
  }
  .auth-input.error:focus {
    border-color: var(--rd);
    box-shadow: none;
  }
`;

const I = {
  eye: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  google: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.35 11.1h-9.2v3h5.3c-.5 2.4-2.6 4-5.3 4a6 6 0 1 1 0-12c1.6 0 3 .6 4.1 1.5l2.2-2.2A9.9 9.9 0 0 0 12 3a10 10 0 1 0 0 20c5.5 0 9.7-3.9 9.7-9.5 0-.6-.1-1.3-.35-2.4z" /></svg>,
};

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export function AuthField({ label, type = "text", value, onChange, placeholder, error, hint, icon, autoComplete, required, showPassword, onTogglePassword }: FieldProps) {
  const paddingLeft = icon ? "38px" : "14px";
  const paddingRight = onTogglePassword ? "42px" : "14px";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: authFieldStyles }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--tx2)" }}>
          {label}{required && <span style={{ color: "var(--rd)", marginLeft: 2 }}>*</span>}
        </label>
        <div style={{ position: "relative" }}>
          {icon && (
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tx3)", pointerEvents: "none" }}>
              {icon}
            </span>
          )}
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`auth-input ${error ? 'error' : ''}`}
            style={{
              paddingLeft,
              paddingRight,
            }}
          />
          {onTogglePassword && (
            <button type="button" onClick={onTogglePassword}
              style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", padding: 2, display: "flex" }}>
              {showPassword ? I.eyeOff(15) : I.eye(15)}
            </button>
          )}
        </div>
        {error && <p style={{ fontSize: 11.5, color: "var(--rd)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13 }}>⚠</span> {error}
        </p>}
        {hint && !error && <p style={{ fontSize: 11, color: "var(--tx3)" }}>{hint}</p>}
      </div>
    </>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: "submit" | "button";
  variant?: "primary" | "ghost";
}

export function AuthButton({ children, loading, icon, onClick, type = "submit", variant = "primary" }: ButtonProps) {
  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        style={{
          width: "100%", height: 44, borderRadius: 10,
          background: "transparent", border: "1px solid var(--br)", color: "var(--tx2)",
          fontSize: 14, fontWeight: 500, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "border-color .15s, background .15s, color .15s",
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = "var(--brh)";
          e.currentTarget.style.background = "var(--bg2)";
          e.currentTarget.style.color = "var(--tx)";
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = "var(--br)";
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--tx2)";
        }}
      >
        {icon}
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%", height: 44, borderRadius: 10,
        background: "var(--ac)", border: "none", color: "#fff",
        fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "background .15s, box-shadow .15s",
        boxShadow: "0 0 0 1px var(--ag), 0 6px 20px var(--ag)",
        opacity: loading ? 0.55 : 1,
        marginTop: 4,
      }}
      onMouseOver={e => {
        if (!loading) {
          e.currentTarget.style.background = "var(--ach)";
          e.currentTarget.style.boxShadow = "0 0 0 1px var(--ag), 0 10px 28px var(--ag)";
        }
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = "var(--ac)";
        e.currentTarget.style.boxShadow = "0 0 0 1px var(--ag), 0 6px 20px var(--ag)";
      }}
    >
      {loading ? (
        <>
          <div className="spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff" }} />
          {typeof children === "string" ? `${children}...` : children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

export function SocialAuth({ mode }: { mode: "signin" | "signup" }) {
  const handleGoogleAuth = async () => {
    // TODO: Implement Google OAuth with Supabase
    alert("Google OAuth - Wire with Supabase Auth");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
      <AuthButton variant="ghost" icon={I.google(16)} onClick={handleGoogleAuth} type="button">
        {mode === "signin" ? "Sign in" : "Sign up"} with Google
      </AuthButton>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--br)" }} />
        <span style={{ fontSize: 12, color: "var(--tx3)", whiteSpace: "nowrap" }}>or continue with email</span>
        <div style={{ flex: 1, height: 1, background: "var(--br)" }} />
      </div>
    </div>
  );
}

export function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "var(--br)" },
    { label: "Very weak", color: "var(--rd)" },
    { label: "Weak", color: "var(--am)" },
    { label: "Fair", color: "var(--am)" },
    { label: "Good", color: "var(--gr)" },
    { label: "Strong", color: "var(--gr)" },
  ];
  return { score, ...map[score] };
}
