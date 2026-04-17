'use client';

import { useState } from 'react';

interface Props {
  fotos: { url: string }[];
  alt: string;
}

function Placeholder() {
  return (
    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center rounded-xl">
      <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4-4a2 2 0 012.83 0L14 15m2-2l1.17-1.17a2 2 0 012.83 0L22 14M14 8a2 2 0 11-4 0 2 2 0 014 0zM3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    </div>
  );
}

export default function PhotoGallery({ fotos, alt }: Props) {
  const [current, setCurrent] = useState(0);

  if (fotos.length === 0) return <Placeholder />;

  const prev = () => setCurrent((i) => (i === 0 ? fotos.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === fotos.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      {/* Foto principale */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[current].url}
          alt={`${alt} — foto ${current + 1}`}
          decoding="async"
          className="w-full h-full object-cover"
        />

        {fotos.length > 1 && (
          <>
            {/* Frecce */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Foto precedente"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Foto successiva"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Contatore */}
            <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
              {current + 1} / {fotos.length}
            </span>
          </>
        )}
      </div>

      {/* Striscia miniature */}
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? 'border-[#003580]' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt={`miniatura ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
