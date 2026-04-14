import type { MetadataRoute } from 'next';
import { prisma } from '../lib/prisma';

const SITE_URL = 'https://www.autodemo24.it';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ricambi = await prisma.ricambio.findMany({
    where: { pubblicato: true, stato: 'DISPONIBILE' },
    select: { id: true, createdAt: true, updatedAt: true },
    orderBy: { id: 'desc' },
    take: 5000,
  });

  const ricambiUrls: MetadataRoute.Sitemap = ricambi.map((r) => ({
    url: `${SITE_URL}/ricambi/${r.id}`,
    lastModified: r.updatedAt ?? r.createdAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/ricambi`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/registrati`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [...staticPages, ...ricambiUrls];
}
