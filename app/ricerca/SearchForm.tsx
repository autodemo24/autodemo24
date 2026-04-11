'use client';

import { PROVINCE } from '../../lib/province';

const MARCHE = [
  'Alfa Romeo', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Citroën', 'Dacia',
  'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lancia', 'Land Rover',
  'Mazda', 'Mercedes', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot',
  'Renault', 'Seat', 'Skoda', 'Smart', 'Subaru', 'Suzuki', 'Toyota',
  'Volkswagen', 'Volvo',
];

interface Props {
  marca?: string;
  modello?: string;
  anno?: string;
  provincia?: string;
}

export default function SearchForm({ marca = '', modello = '', anno = '', provincia = '' }: Props) {
  return (
    <form
      action="/ricerca"
      method="GET"
      className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3"
    >
      <select
        name="marca"
        defaultValue={marca}
        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm"
      >
        <option value="">Tutte le marche</option>
        {MARCHE.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <input
        type="text"
        name="modello"
        defaultValue={modello}
        placeholder="Modello"
        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm"
      />

      <input
        type="number"
        name="anno"
        defaultValue={anno}
        placeholder="Anno"
        min={1900}
        max={new Date().getFullYear() + 1}
        className="w-28 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm"
      />

      <select
        name="provincia"
        defaultValue={provincia}
        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm"
      >
        <option value="">Tutte le province</option>
        {PROVINCE.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <button
        type="submit"
        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm whitespace-nowrap"
      >
        Cerca
      </button>
    </form>
  );
}
