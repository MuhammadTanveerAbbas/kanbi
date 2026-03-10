import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kanbi Board',
    description: 'Turn client meeting notes into Kanban tasks instantly. For freelance consultants.',
  };
}
