import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kanbi - AI Task Management',
    short_name: 'Kanbi',
    description: 'Paste text, a PDF, or a web page URL and get a Kanban board, a workload health score, and DOCX or PDF export.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07070b',
    theme_color: '#5e6fe8',
    icons: [
      {
        src: '/icon',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
