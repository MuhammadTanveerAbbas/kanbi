'use client';

import Link from "next/link";
import { useState } from "react";

export default function NotFound() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const SearchIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  const HomeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

  const DashboardIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #07070b 0%, #0f0f1a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .not-found-container {
          animation: fadeIn 0.6s ease-out;
          position: relative;
          z-index: 10;
        }
        .not-found-title {
          animation: slideDown 0.8s ease-out;
        }
        .not-found-icon {
          animation: float 4s ease-in-out infinite;
        }
        .feature-card {
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(94, 111, 232, 0.4);
          background: rgba(94, 111, 232, 0.12);
        }
        .bg-glow {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: pulse 4s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .not-found-title {
            font-size: 80px !important;
          }
          .not-found-heading {
            font-size: 24px !important;
          }
          .feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .not-found-title {
            font-size: 60px !important;
          }
          .not-found-heading {
            font-size: 20px !important;
          }
          .button-group {
            flex-direction: column !important;
          }
          .button-group a {
            width: 100% !important;
          }
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Background glows */}
      <div className="bg-glow" style={{
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, #5e6fe8 0%, transparent 70%)",
        top: "-100px",
        left: "-100px",
      }} />
      <div className="bg-glow" style={{
        width: "250px",
        height: "250px",
        background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
        bottom: "-80px",
        right: "-80px",
        animationDelay: "2s",
      }} />

      <div className="not-found-container" style={{
        textAlign: "center",
        maxWidth: "600px",
      }}>
        {/* Icon */}
        <div className="not-found-icon" style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "center",
          color: "#5e6fe8",
        }}>
          <SearchIcon />
        </div>

        {/* 404 Number */}
        <div className="not-found-title" style={{
          fontSize: "120px",
          fontWeight: "900",
          background: "linear-gradient(135deg, #5e6fe8 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "16px",
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}>
          404
        </div>

        {/* Heading */}
        <h1 className="not-found-heading" style={{
          fontSize: "28px",
          fontWeight: "800",
          color: "#e0e0ea",
          marginBottom: "12px",
          letterSpacing: "-0.035em",
          fontFamily: "Plus Jakarta Sans, -apple-system, sans-serif",
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          fontSize: "15px",
          color: "#9a9aae",
          marginBottom: "40px",
          lineHeight: "1.7",
          maxWidth: "480px",
          margin: "0 auto 40px",
        }}>
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="button-group" style={{
          display: "flex",
          gap: "14px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "56px",
        }}>
          <Link href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px 28px",
              borderRadius: "10px",
              background: hoveredButton === "home" 
                ? "linear-gradient(135deg, #6e7ff8 0%, #b89bfa 100%)"
                : "linear-gradient(135deg, #5e6fe8 0%, #a78bfa 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              textDecoration: "none",
              transition: "all 0.3s ease",
              border: "none",
              cursor: "pointer",
              boxShadow: hoveredButton === "home"
                ? "0 12px 32px rgba(94, 111, 232, 0.5)"
                : "0 6px 20px rgba(94, 111, 232, 0.35)",
              transform: hoveredButton === "home" ? "translateY(-3px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHoveredButton("home")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <HomeIcon />
            Back to Home
          </Link>

          <Link href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px 28px",
              borderRadius: "10px",
              background: hoveredButton === "dashboard"
                ? "rgba(255, 255, 255, 0.14)"
                : "rgba(255, 255, 255, 0.08)",
              color: "#e0e0ea",
              fontSize: "14px",
              fontWeight: "700",
              textDecoration: "none",
              transition: "all 0.3s ease",
              border: hoveredButton === "dashboard"
                ? "1.5px solid rgba(255, 255, 255, 0.25)"
                : "1.5px solid rgba(255, 255, 255, 0.15)",
              cursor: "pointer",
              transform: hoveredButton === "dashboard" ? "translateY(-3px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHoveredButton("dashboard")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <DashboardIcon />
            Go to Dashboard
          </Link>
        </div>


      </div>
    </div>
  );
}
