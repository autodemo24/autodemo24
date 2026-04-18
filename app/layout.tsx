import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = 'https://autigo.it';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Autigo — Il marketplace italiano dei ricambi auto usati',
    template: '%s | Autigo',
  },
  description:
    'Trova ricambi auto usati dai demolitori italiani. Cerca per marca, modello, anno e provincia. Migliaia di ricambi disponibili in tutta Italia.',
  keywords: [
    'ricambi auto usati',
    'autigo',
    'demolitori auto',
    'autodemolitori Italia',
    'ricambi auto demolitori',
    'pezzi di ricambio auto',
    'ricambi usati online',
    'autodemolizione',
    'ricambi auto economici',
    'parti auto usate',
  ],
  authors: [{ name: 'Autigo' }],
  creator: 'Autigo',
  publisher: 'Autigo',
  formatDetection: {
    email: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: SITE_URL,
    siteName: 'Autigo',
    title: 'Autigo — Il marketplace italiano dei ricambi auto usati',
    description:
      'Trova ricambi auto usati dai demolitori italiani. Cerca per marca, modello, anno e provincia.',
    images: [
      {
        url: '/images/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Autigo — Ricambi auto dai demolitori italiani',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autigo — Il marketplace italiano dei ricambi auto usati',
    description:
      'Trova ricambi auto usati dai demolitori italiani. Cerca per marca, modello, anno e provincia.',
    images: ['/images/og-cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  );
}
