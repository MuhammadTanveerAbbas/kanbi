import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Kanbi - AI Task Management That Saves 2 Hours Daily';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07070b',
          position: 'relative',
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />

        {/* Gradient glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(94,111,232,0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #5e6fe8 0%, #a78bfa 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
              boxShadow: '0 0 80px rgba(94,111,232,0.5)',
            }}
          >
            <svg
              width="70"
              height="70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#e0e0ea',
              marginBottom: '20px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            Kanbi
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '36px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #e0e0ea 0%, #787896 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '30px',
              textAlign: 'center',
            }}
          >
            AI Task Management That Saves 2 Hours Daily
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '20px',
            }}
          >
            {['Groq AI Powered', 'Burnout Prevention', 'Free Forever'].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  background: 'rgba(94,111,232,0.12)',
                  border: '1px solid rgba(94,111,232,0.3)',
                  color: '#5e6fe8',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                {feature}
              </div>
            ))}
          </div>

          {/* Bottom text */}
          <div
            style={{
              marginTop: '50px',
              fontSize: '24px',
              color: '#787896',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
              }}
            />
            kanbi.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
