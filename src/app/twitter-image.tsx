import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'Kanbi - turn notes into a Kanban board';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const LINES = ['Paste notes and get a Kanban board'];

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
          background: '#ffffff',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '24px',
            background: '#5162db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <div
          style={{
            fontSize: '64px',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#0a0a18',
            lineHeight: 1.1,
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          Kanbi
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {LINES.map((line, i) => (
            <div
              key={line}
              style={{
                fontSize: '34px',
                fontWeight: 400,
                color: '#4a4a72',
                lineHeight: 1.35,
                textAlign: 'center',
                marginBottom: i === LINES.length - 1 ? 0 : '6px',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
