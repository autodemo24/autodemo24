'use client';

import { useEffect, useState } from 'react';
import { MARCHE } from '../lib/veicoli-db';

interface Props {
  marca?: string;
  modello?: string;
  marcaName?: string;
  modelloName?: string;
  className?: string;
  onMarcaChange?: (marca: string) => void;
  onModelloChange?: (modello: string) => void;
}

export default function MarcaModelloSelect({
  marca: initialMarca = '',
  modello: initialModello = '',
  marcaName = 'marca',
  modelloName = 'modello',
  className = '',
  onMarcaChange,
  onModelloChange,
}: Props) {
  const [marca, setMarca] = useState(initialMarca);
  const [modello, setModello] = useState(initialModello);
  const [modelli, setModelli] = useState<string[]>([]);

  useEffect(() => {
    if (!marca) {
      setModelli([]);
      return;
    }
    fetch(`/api/modelli?marca=${encodeURIComponent(marca)}`)
      .then((r) => r.json())
      .then((data: string[]) => setModelli(data))
      .catch(() => setModelli([]));
  }, [marca]);

  const inputClass = `w-full px-3 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white ${className}`;

  return (
    <>
      <select
        name={marcaName}
        value={marca}
        onChange={(e) => {
          setMarca(e.target.value);
          setModello('');
          onMarcaChange?.(e.target.value);
          onModelloChange?.('');
        }}
        className={inputClass}
      >
        <option value="">Tutte le marche</option>
        {MARCHE.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        name={modelloName}
        value={modello}
        onChange={(e) => {
          setModello(e.target.value);
          onModelloChange?.(e.target.value);
        }}
        disabled={!marca}
        className={`${inputClass} ${!marca ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      >
        <option value="">Tutti i modelli</option>
        {modelli.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </>
  );
}
