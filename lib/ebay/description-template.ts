type RicambioData = {
  nome: string;
  marca: string;
  modello: string;
  anno: number | null;
  cilindrata: string | null;
  alimentazione: string | null;
  kw: number | null;
  km: number | null;
  codiceMotore: string | null;
  codiceOe: string | null;
  mpn: string | null;
  ean: string | null;
  telaio: string | null;
  targa: string | null;
  condizione: string | null;
  modelloAuto: {
    annoInizio: number | null;
    annoFine: number | null;
  } | null;
};

type DemolitoreData = {
  ragioneSociale: string;
};

function formatAnniProduzione(m: RicambioData['modelloAuto']): string {
  if (!m) return '';
  if (m.annoInizio && m.annoFine) return `${m.annoInizio} → ${m.annoFine}`;
  if (m.annoInizio) return `dal ${m.annoInizio}`;
  if (m.annoFine) return `fino al ${m.annoFine}`;
  return '';
}

export function applicaTemplate(template: string, ricambio: RicambioData, demolitore: DemolitoreData): string {
  const map: Record<string, string> = {
    '{nome}': ricambio.nome || '',
    '{marca}': ricambio.marca || '',
    '{modello}': ricambio.modello || '',
    '{anno}': ricambio.anno ? String(ricambio.anno) : '',
    '{anniProduzione}': formatAnniProduzione(ricambio.modelloAuto),
    '{cilindrata}': ricambio.cilindrata?.trim() || '',
    '{alimentazione}': ricambio.alimentazione?.trim() || '',
    '{kw}': ricambio.kw ? `${ricambio.kw} kW` : '',
    '{km}': ricambio.km ? `${ricambio.km.toLocaleString('it-IT')} km` : '',
    '{codiceMotore}': ricambio.codiceMotore?.trim() || '',
    '{codiceOe}': ricambio.codiceOe?.trim() || '',
    '{mpn}': ricambio.mpn?.trim() || '',
    '{ean}': ricambio.ean?.trim() || '',
    '{telaio}': ricambio.telaio?.trim() || '',
    '{targa}': ricambio.targa?.trim() || '',
    '{condizione}': ricambio.condizione || '',
    '{ragioneSociale}': demolitore.ragioneSociale || '',
  };
  return template.replace(
    /\{(nome|marca|modello|anno|anniProduzione|cilindrata|alimentazione|kw|km|codiceMotore|codiceOe|mpn|ean|telaio|targa|condizione|ragioneSociale)\}/g,
    (m) => map[m] ?? m,
  );
}

export function toHtmlDescription(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
}
