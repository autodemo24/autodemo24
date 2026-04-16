// Categorie eBay IT per ricambi auto.
// IMPORTANTE: solo categorie foglia (leaf), non parent. eBay rifiuta listing su categorie con figli.
// Lista provvisoria. La prossima iterazione user\u00e0 eBay Taxonomy API per autocompletare in modo sicuro.

export type EbayCategory = {
  id: string;
  label: string;
  parentPath: string;
};

export const EBAY_CATEGORIES_IT: EbayCategory[] = [
  { id: '33557', label: 'Centraline motore (ECU)', parentPath: 'Auto > ECU' },
  { id: '33585', label: 'Alternatori e generatori', parentPath: 'Auto > Motori avviamento' },
  { id: '33584', label: 'Motorini di avviamento', parentPath: 'Auto > Motori avviamento' },
  { id: '33712', label: 'Fari anteriori', parentPath: 'Auto > Illuminazione' },
  { id: '33713', label: 'Fari posteriori', parentPath: 'Auto > Illuminazione' },
  { id: '33715', label: 'Lampadine', parentPath: 'Auto > Illuminazione' },
  { id: '33559', label: 'Pastiglie freno', parentPath: 'Auto > Freni' },
  { id: '33565', label: 'Dischi freno', parentPath: 'Auto > Freni' },
  { id: '33564', label: 'Pinze freno', parentPath: 'Auto > Freni' },
  { id: '33649', label: 'Ammortizzatori', parentPath: 'Auto > Sospensioni' },
  { id: '33650', label: 'Molle sospensione', parentPath: 'Auto > Sospensioni' },
  { id: '33615', label: 'Turbo e compressori', parentPath: 'Auto > Motori' },
  { id: '33616', label: 'Iniettori carburante', parentPath: 'Auto > Motori' },
  { id: '33646', label: 'Cambi manuali', parentPath: 'Auto > Trasmissione' },
  { id: '33647', label: 'Cambi automatici', parentPath: 'Auto > Trasmissione' },
  { id: '33648', label: 'Frizioni', parentPath: 'Auto > Trasmissione' },
  { id: '33706', label: 'Paraurti anteriori', parentPath: 'Auto > Carrozzeria' },
  { id: '33707', label: 'Paraurti posteriori', parentPath: 'Auto > Carrozzeria' },
  { id: '33708', label: 'Cofani', parentPath: 'Auto > Carrozzeria' },
  { id: '33709', label: 'Portiere', parentPath: 'Auto > Carrozzeria' },
  { id: '33710', label: 'Parafanghi', parentPath: 'Auto > Carrozzeria' },
  { id: '33726', label: 'Specchietti retrovisori', parentPath: 'Auto > Carrozzeria' },
  { id: '33599', label: 'Sedili', parentPath: 'Auto > Interni' },
  { id: '33600', label: 'Volanti', parentPath: 'Auto > Interni' },
  { id: '33601', label: 'Cruscotti', parentPath: 'Auto > Interni' },
  { id: '33744', label: 'Radiatori', parentPath: 'Auto > Raffreddamento' },
  { id: '33745', label: 'Pompe acqua', parentPath: 'Auto > Raffreddamento' },
];

export function findCategoryById(id: string): EbayCategory | undefined {
  return EBAY_CATEGORIES_IT.find((c) => c.id === id);
}
