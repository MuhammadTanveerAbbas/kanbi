import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kanbi - AI Task Management',
    short_name: 'Kanbi',
    description: 'AI powered task management that saves 2 hours daily. Groq AI, Notion sync, burnout prevention.',
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
