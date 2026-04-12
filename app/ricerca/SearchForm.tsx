'use client';

import { PROVINCE } from '../../lib/province';

const MARCHE = [
  'Alfa Romeo','Audi','BMW','Chevrolet','Citroën','Dacia','Fiat','Ford',
  'Honda','Hyundai','Jeep','Kia','Lancia','Land Rover','Mazda','Mercedes',
  'Mini','Mitsubishi','Nissan','Opel','Peugeot','Renault','Seat','Skoda',
  'Smart','Suzuki','Toyota','Volkswagen','Volvo',
];

const CARBURANTI = ['Benzina','Diesel','Ibrido','Ibrido Plug-in','Elettrico','GPL','Metano'];

interface Props {
  marca?: string;
  modello?: string;
  anno?: string;
  provincia?: string;
  carburante?: string;
}

export default function SearchForm({ marca = '', modello = '', anno = '', provincia = '', carburante = '' }: Props) {
  return (
    <form action="/ricerca" method="GET" className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marca</label>
        <select name="marca" defaultValue={marca}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white">
          <option value="">Tutte le marche</option>
          {MARCHE.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Modello</label>
        <input type="text" name="modello" defaultValue={modello} placeholder="es. Panda, Golf…"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Anno immatricolazione</label>
        <input type="number" name="anno" defaultValue={anno} placeholder="es. 2015"
          min={1990} max={new Date().getFullYear() + 1}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Provincia</label>
        <select name="provincia" defaultValue={provincia}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white">
          <option value="">Tutta Italia</option>
          {PROVINCE.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alimentazione</label>
        <select name="carburante" defaultValue={carburante}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/20 outline-none bg-white">
          <option value="">Qualsiasi</option>
          {CARBURANTI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button type="submit"
        className="w-full py-3 bg-[#FF6600] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors">
        Cerca
      </button>

      <a href="/ricerca"
        className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
        Rimuovi tutti i filtri
      </a>
    </form>
  );
}
