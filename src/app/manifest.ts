import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kanbi - AI Task Management',
    short_name: 'Kanbi',
    description: 'Paste text, a PDF, or a web page URL and get a Kanban board, a workload health score, and DOCX or PDF export.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // Sampled from public/Kanbi.png, the single source for every icon size.
    theme_color: '#004DB9',
    icons: [
      {
        src: '/icon.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
