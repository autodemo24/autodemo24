export const RICAMBI_GRUPPI = [
  {
    categoria: 'Meccanica',
    voci: [
      'Motore completo', 'Testata motore', 'Blocco motore', 'Cambio manuale', 'Cambio automatico',
      'Frizione', 'Volano', 'Semiasse sinistro', 'Semiasse destro',
      'Radiatore', 'Radiatore AC', 'Intercooler',
      'Alternatore', 'Motorino di avviamento', 'Compressore AC',
      'Pompa acqua', 'Pompa olio', 'Pompa carburante', 'Pompa iniezione',
      'Iniettori', 'Corpo farfallato', 'Collettore aspirazione', 'Collettore scarico',
      'Turbocompressore', 'Catalizzatore', 'FAP / DPF', 'Marmitta', 'Tubo di scarico',
      'Cinghia distribuzione', 'Catena distribuzione', 'Tendicinghia',
      'Servosterzo', 'Pompa servosterzo', 'Scatola sterzo',
    ],
  },
  {
    categoria: 'Carrozzeria',
    voci: [
      'Cofano', 'Portellone posteriore',
      'Paraurti anteriore', 'Paraurti posteriore',
      'Parafango anteriore sinistro', 'Parafango anteriore destro',
      'Parafango posteriore sinistro', 'Parafango posteriore destro',
      'Portiera anteriore sinistra', 'Portiera anteriore destra',
      'Portiera posteriore sinistra', 'Portiera posteriore destra',
      'Fiancata sinistra', 'Fiancata destra',
      'Traversa anteriore', 'Traversa posteriore',
      'Rinforzo paraurti anteriore', 'Rinforzo paraurti posteriore',
      'Passaruota anteriore sinistro', 'Passaruota anteriore destro',
      'Maniglia porta anteriore sinistra', 'Maniglia porta anteriore destra',
      'Maniglia porta posteriore sinistra', 'Maniglia porta posteriore destra',
    ],
  },
  {
    categoria: 'Illuminazione',
    voci: [
      'Faro anteriore sinistro', 'Faro anteriore destro',
      'Faro fendinebbia sinistro', 'Faro fendinebbia destro',
      'Fanale posteriore sinistro', 'Fanale posteriore destro',
      'Terzo stop',
      'Freccia anteriore sinistra', 'Freccia anteriore destra',
      'Freccia laterale sinistra', 'Freccia laterale destra',
      'Specchietto retrovisore sinistro', 'Specchietto retrovisore destro',
      'Specchietto retrovisore interno',
    ],
  },
  {
    categoria: 'Vetri',
    voci: [
      'Parabrezza', 'Lunotto',
      'Cristallo laterale anteriore sinistro', 'Cristallo laterale anteriore destro',
      'Cristallo laterale posteriore sinistro', 'Cristallo laterale posteriore destro',
      'Vetro portiera anteriore sinistra', 'Vetro portiera anteriore destra',
      'Vetro portiera posteriore sinistra', 'Vetro portiera posteriore destra',
    ],
  },
  {
    categoria: 'Interni',
    voci: [
      'Cruscotto completo', 'Quadro strumenti', 'Volante',
      'Sedile anteriore sinistro', 'Sedile anteriore destro',
      'Sedili posteriori', 'Pannello porta anteriore sinistro', 'Pannello porta anteriore destro',
      'Pannello porta posteriore sinistro', 'Pannello porta posteriore destro',
      'Console centrale', 'Leva cambio', 'Pedaliera',
      'Cielo abitacolo', 'Moquette / Tappetini',
      'Airbag volante', 'Airbag passeggero', 'Airbag laterale sinistro', 'Airbag laterale destro',
      'Airbag a tendina sinistro', 'Airbag a tendina destro',
      'Cintura di sicurezza anteriore sinistra', 'Cintura di sicurezza anteriore destra',
      'Cintura di sicurezza posteriore',
    ],
  },
  {
    categoria: 'Elettronica',
    voci: [
      'Centralina ECU', 'Centralina ABS', 'Centralina airbag', 'Centralina cambio',
      'Centralina climatizzatore', 'Body computer',
      'Motorino tergicristalli anteriore', 'Motorino tergicristalli posteriore',
      'Motorino alzavetro anteriore sinistro', 'Motorino alzavetro anteriore destro',
      'Motorino alzavetro posteriore sinistro', 'Motorino alzavetro posteriore destro',
      'Navigatore / Infotainment', 'Autoradio', 'Display multifunzione',
      'Sensori parcheggio', 'Telecamera posteriore',
      'Chiave / Telecomando',
    ],
  },
  {
    categoria: 'Climatizzazione',
    voci: [
      'Compressore climatizzatore', 'Condensatore AC', 'Evaporatore AC',
      'Ventola abitacolo', 'Ventola radiatore',
      'Resistenza ventola', 'Comando clima',
    ],
  },
  {
    categoria: 'Ruote e freni',
    voci: [
      'Ammortizzatore anteriore sinistro', 'Ammortizzatore anteriore destro',
      'Ammortizzatore posteriore sinistro', 'Ammortizzatore posteriore destro',
      'Molla anteriore sinistra', 'Molla anteriore destra',
      'Molla posteriore sinistra', 'Molla posteriore destra',
      'Braccio oscillante anteriore sinistro', 'Braccio oscillante anteriore destro',
      'Barra stabilizzatrice anteriore', 'Barra stabilizzatrice posteriore',
      'Mozzo anteriore sinistro', 'Mozzo anteriore destro',
      'Mozzo posteriore sinistro', 'Mozzo posteriore destro',
      'Pinza freno anteriore sinistra', 'Pinza freno anteriore destra',
      'Pinza freno posteriore sinistra', 'Pinza freno posteriore destra',
      'Disco freno anteriore', 'Disco freno posteriore',
      'Freno a mano', 'Pompa freno',
      'Cerchio in lega', 'Cerchio in ferro', 'Pneumatico',
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
