import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function RicercaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp.q) params.set('q', sp.q);
  if (sp.marca) params.set('marca', sp.marca);
  if (sp.modello) params.set('modello', sp.modello);
  if (sp.anno) params.set('anno', sp.anno);
  if (sp.provincia) params.set('provincia', sp.provincia);
  redirect(`/ricambi${params.toString() ? '?' + params.toString() : ''}`);
}
