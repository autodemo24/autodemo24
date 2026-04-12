import type { MetadataRoute } from 'next';
import { prisma } from '../lib/prisma';

const SITE_URL = 'https://www.autodemo24.it';

function toSeoSlug(value: string): string {
  return encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [veicoli, marcheModelli] = await Promise.all([
    prisma.veicolo.findMany({
      where: { pubblicato: true },
      select: { id: true, createdAt: true },
      orderBy: { id: 'desc' },
    }),
    prisma.veicolo.findMany({
      where: {
        pubblicato: true,
        ricambi: { some: { disponibile: true } },
      },
      select: { marca: true, modello: true },
      distinct: ['marca', 'modello'],
    }),
  ]);

  const veicoliUrls: MetadataRoute.Sitemap = veicoli.map((v) => ({
    url: `${SITE_URL}/veicoli/${v.id}`,
    lastModified: v.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Pagine /ricambi/[marca] e /ricambi/[marca]/[modello]
  const marcheSet = new Set<string>();
  const ricambiUrls: MetadataRoute.Sitemap = [];

  for (const { marca, modello } of marcheModelli) {
    marcheSet.add(marca);
    ricambiUrls.push({
      url: `${SITE_URL}/ricambi/${toSeoSlug(marca)}/${toSeoSlug(modello)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  const marcheUrls: MetadataRoute.Sitemap = Array.from(marcheSet).map((marca) => ({
    url: `${SITE_URL}/ricambi/${toSeoSlug(marca)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/ricambi`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ricerca`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/registrati`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  return [...staticPages, ...marcheUrls, ...ricambiUrls, ...veicoliUrls];
}
