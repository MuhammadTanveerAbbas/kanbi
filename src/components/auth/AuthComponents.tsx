"use client";

import React, { useId, useState } from "react";
import { ErrorNotice } from "@/components/error-notice";

const authFieldStyles = `
  .auth-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 9px;
    border: 1px solid var(--br);
    background: var(--inp);
    font-family: inherit;
    font-size: 14px;
    line-height: 1.45;
    color: var(--tx);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .auth-input::placeholder {
    color: var(--tx3);
  }
  .auth-input:focus {
    border-color: var(--br);
    box-shadow: none;
  }
  .auth-input.error {
    border-color: var(--rd);
  }
  .auth-input.error:focus {
    border-color: var(--rd);
    box-shadow: none;
  }
  .auth-eye-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--tx3);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    transition: color .15s;
  }
  .auth-eye-btn:hover,
  .auth-eye-btn:focus-visible {
    color: var(--tx);
  }
`;

const I = {
  eye: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  google: (s = 18) => <svg width={s} height={s} viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.33 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.67 14.62 48 24 48z"/></svg>,
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
  const inputId = useId();
  const paddingLeft = icon ? "38px" : "14px";
  const paddingRight = onTogglePassword ? "42px" : "14px";
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: authFieldStyles }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 600, color: "var(--tx2)" }}>
          {label}{required && <span aria-hidden="true" style={{ color: "var(--rd-text)", marginLeft: 2 }}>*</span>}
        </label>
        <div style={{ position: "relative" }}>
          {icon && (
            <span aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tx3)", pointerEvents: "none", display: "flex" }}>
              {icon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-required={required ? true : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={`auth-input ${error ? 'error' : ''}`}
            style={{
              paddingLeft,
              paddingRight,
            }}
          />
          {onTogglePassword && (
            <button type="button" className="auth-eye-btn" onClick={onTogglePassword}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? I.eyeOff(15) : I.eye(15)}
            </button>
          )}
        </div>
        {error && <ErrorNotice id={errorId} variant="inline">{error}</ErrorNotice>}
        {hint && !error && <p id={hintId} style={{ fontSize: 11, color: "var(--tx3)", lineHeight: 1.45 }}>{hint}</p>}
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
        disabled={loading}
        aria-busy={loading ? true : undefined}
        style={{
          width: "100%", height: 44, borderRadius: 10,
          background: "transparent", border: "1px solid var(--br)", color: "var(--tx2)",
          fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "border-color .15s, background .15s, color .15s",
          opacity: loading ? 0.55 : 1,
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
      aria-busy={loading ? true : undefined}
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
          {children}
          {icon}
        </>
      )}
    </button>
  );
}

export function SocialAuth({ mode }: { mode: "signin" | "signup" }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
          skipBrowserRedirect: false,
        },
      });
      if (error) setError(error.message);
    } catch (e: any) {
      setError(e?.message ?? "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
      <AuthButton variant="ghost" icon={I.google(16)} onClick={handleGoogleAuth} type="button" loading={loading}>
        {mode === "signin" ? "Sign in" : "Sign up"} with Google
      </AuthButton>
      {error && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ErrorNotice variant="inline">{error}</ErrorNotice>
        </div>
      )}
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
    { label: "Very weak", color: "var(--rd-text)" },
    { label: "Weak", color: "var(--am-text)" },
    { label: "Fair", color: "var(--am-text)" },
    { label: "Good", color: "var(--gr-text)" },
    { label: "Strong", color: "var(--gr-text)" },
  ];
  return { score, ...map[score]! };
}
