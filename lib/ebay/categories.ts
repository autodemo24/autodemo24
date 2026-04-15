// Mapping semplificato categorie eBay IT per ricambi auto.
// IDs verificati su eBay.it Browse categories (Auto e moto: ricambi e accessori).
// Copertura non esaustiva — le top categorie per ricambi di demolizione.
// Per aspirare tutte, in futuro si può chiamare Taxonomy API con getCategorySuggestions.

export type EbayCategory = {
  id: string;
  label: string;
  parentPath: string;
};

export const EBAY_CATEGORIES_IT: EbayCategory[] = [
  { id: '33556', label: 'ECU e moduli di computer', parentPath: 'Auto: ricambi > Motorini avviamento, alternatori, ECU' },
  { id: '33557', label: 'Centraline motore', parentPath: 'Auto: ricambi > Motorini avviamento, alternatori, ECU' },
  { id: '33585', label: 'Alternatori e generatori', parentPath: 'Auto: ricambi > Motorini avviamento, alternatori, ECU' },
  { id: '33584', label: 'Motorini di avviamento', parentPath: 'Auto: ricambi > Motorini avviamento, alternatori, ECU' },
  { id: '33712', label: 'Fari anteriori', parentPath: 'Auto: ricambi > Illuminazione' },
  { id: '33713', label: 'Fari posteriori', parentPath: 'Auto: ricambi > Illuminazione' },
  { id: '33715', label: 'Lampadine', parentPath: 'Auto: ricambi > Illuminazione' },
  { id: '33559', label: 'Pastiglie freno', parentPath: 'Auto: ricambi > Freni' },
  { id: '33565', label: 'Dischi freno', parentPath: 'Auto: ricambi > Freni' },
  { id: '33564', label: 'Pinze freno', parentPath: 'Auto: ricambi > Freni' },
  { id: '33649', label: 'Ammortizzatori', parentPath: 'Auto: ricambi > Sospensioni' },
  { id: '33650', label: 'Molle sospensione', parentPath: 'Auto: ricambi > Sospensioni' },
  { id: '33637', label: 'Motori completi', parentPath: 'Auto: ricambi > Motori' },
  { id: '33615', label: 'Turbo e compressori', parentPath: 'Auto: ricambi > Motori' },
  { id: '33616', label: 'Iniettori carburante', parentPath: 'Auto: ricambi > Motori' },
  { id: '33646', label: 'Cambi manuali', parentPath: 'Auto: ricambi > Trasmissione' },
  { id: '33647', label: 'Cambi automatici', parentPath: 'Auto: ricambi > Trasmissione' },
  { id: '33648', label: 'Frizioni', parentPath: 'Auto: ricambi > Trasmissione' },
  { id: '33706', label: 'Paraurti anteriori', parentPath: 'Auto: ricambi > Carrozzeria' },
  { id: '33707', label: 'Paraurti posteriori', parentPath: 'Auto: ricambi > Carrozzeria' },
  { id: '33708', label: 'Cofani', parentPath: 'Auto: ricambi > Carrozzeria' },
  { id: '33709', label: 'Portiere', parentPath: 'Auto: ricambi > Carrozzeria' },
  { id: '33710', label: 'Parafanghi', parentPath: 'Auto: ricambi > Carrozzeria' },
  { id: '33599', label: 'Sedili', parentPath: 'Auto: ricambi > Interni' },
  { id: '33600', label: 'Volanti', parentPath: 'Auto: ricambi > Interni' },
  { id: '33601', label: 'Cruscotti', parentPath: 'Auto: ricambi > Interni' },
  { id: '33726', label: 'Specchietti retrovisori', parentPath: 'Auto: ricambi > Carrozzeria' },
  { id: '33744', label: 'Radiatori', parentPath: 'Auto: ricambi > Raffreddamento' },
  { id: '33745', label: 'Pompe acqua', parentPath: 'Auto: ricambi > Raffreddamento' },
  { id: '6030', label: 'Altri ricambi auto', parentPath: 'Auto: ricambi e accessori' },
];

export function findCategoryById(id: string): EbayCategory | undefined {
  return EBAY_CATEGORIES_IT.find((c) => c.id === id);
}
