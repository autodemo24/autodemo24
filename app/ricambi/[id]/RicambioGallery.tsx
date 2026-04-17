'use client';

import { useState } from 'react';

interface Foto {
  id: number;
  url: string;
}

interface Props {
  foto: Foto[];
  alt: string;
}

export default function RicambioGallery({ foto, alt }: Props) {
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const count = foto.length;

  if (count === 0) {
    return (
      <div className="w-full aspect-square bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-300">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + count) % count);
  const next = () => setIdx((i) => (i + 1) % count);

  return (
    <div className="flex gap-3">
      {/* Thumbnails colonna sinistra */}
      {count > 1 && (
        <div className="hidden sm:flex flex-col gap-2 shrink-0 w-[72px]">
          {foto.map((f, i) => (
            <button key={f.id} type="button" onClick={() => setIdx(i)}
              className={`w-[72px] h-[72px] rounded border-2 overflow-hidden bg-white flex items-center justify-center p-1 transition-colors ${
                i === idx ? 'border-[#003580]' : 'border-gray-200 hover:border-gray-400'
              }`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" loading="lazy" decoding="async" className="max-w-full max-h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Foto principale */}
      <div className="relative flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto[idx].url} alt={alt} decoding="async" className="max-w-full max-h-full object-contain" />

        {/* Save heart */}
        <button type="button" onClick={() => setSaved((v) => !v)} aria-label="Aggiungi ai preferiti"
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center transition-all">
          <svg className={`w-5 h-5 ${saved ? 'text-[#FF6600] fill-[#FF6600]' : 'text-gray-700'}`}
            fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Arrows */}
        {count > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Precedente"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center transition-all">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="button" onClick={next} aria-label="Successiva"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md flex items-center justify-center transition-all">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
