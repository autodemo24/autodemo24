export const RICAMBI_GRUPPI = [
  {
    categoria: 'Meccanica',
    voci: [
      'Motore completo', 'Cambio', 'Radiatore', 'Alternatore',
      'Motorino di avviamento', 'Compressore AC', 'Pompa carburante', 'Marmitta / Scarico',
    ],
  },
  {
    categoria: 'Carrozzeria',
    voci: [
      'Cofano', 'Paraurti anteriore', 'Paraurti posteriore',
      'Parafango ant. sinistro', 'Parafango ant. destro',
      'Portiera ant. sinistra', 'Portiera ant. destra',
      'Portiera post. sinistra', 'Portiera post. destra',
    ],
  },
  {
    categoria: 'Illuminazione',
    voci: [
      'Faro ant. sinistro', 'Faro ant. destro',
      'Fanale post. sinistro', 'Fanale post. destro',
      'Specchietto sinistro', 'Specchietto destro',
    ],
  },
  {
    categoria: 'Vetri',
    voci: ['Parabrezza', 'Lunotto', 'Cristallo lat. sinistro', 'Cristallo lat. destro'],
  },
  {
    categoria: 'Interni',
    voci: [
      'Cruscotto completo', 'Volante', 'Sedile ant. sinistro', 'Sedile ant. destro',
      'Sedili posteriori', 'Airbag volante', 'Airbag passeggero', 'Centralina ECU',
    ],
  },
  {
    categoria: 'Ruote e freni',
    voci: [
      'Sospensioni anteriori', 'Sospensioni posteriori',
      'Freni anteriori', 'Freni posteriori',
      'Cerchi in lega', 'Pneumatici',
    ],
  },
] as const;

/** Raggruppa un array di nomi ricambio per categoria. I nomi non riconosciuti vanno in "Altro". */
export function raggruppaRicambi(nomi: string[]): { categoria: string; voci: string[] }[] {
  const mappa = new Map<string, string[]>();

  for (const nome of nomi) {
    const gruppo = RICAMBI_GRUPPI.find((g) => (g.voci as readonly string[]).includes(nome));
    const cat = gruppo?.categoria ?? 'Altro';
    if (!mappa.has(cat)) mappa.set(cat, []);
    mappa.get(cat)!.push(nome);
  }

  // Mantieni l'ordine canonico, poi "Altro" in fondo
  const ordine = [...RICAMBI_GRUPPI.map((g) => g.categoria), 'Altro'];
  return ordine
    .filter((cat) => mappa.has(cat))
    .map((cat) => ({ categoria: cat, voci: mappa.get(cat)! }));
}
