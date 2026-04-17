type RicambioData = {
  nome: string;
  marca: string;
  modello: string;
  anno: number | null;
  codiceOe: string | null;
  mpn: string | null;
  targa: string | null;
  condizione: string | null;
};

type DemolitoreData = {
  ragioneSociale: string;
};

export function applicaTemplate(template: string, ricambio: RicambioData, demolitore: DemolitoreData): string {
  const map: Record<string, string> = {
    '{nome}': ricambio.nome || '',
    '{marca}': ricambio.marca || '',
    '{modello}': ricambio.modello || '',
    '{anno}': ricambio.anno ? String(ricambio.anno) : '',
    '{codiceOe}': ricambio.codiceOe?.trim() || '',
    '{mpn}': ricambio.mpn?.trim() || '',
    '{targa}': ricambio.targa?.trim() || '',
    '{condizione}': ricambio.condizione || '',
    '{ragioneSociale}': demolitore.ragioneSociale || '',
  };
  return template.replace(/\{(nome|marca|modello|anno|codiceOe|mpn|targa|condizione|ragioneSociale)\}/g, (m) => map[m] ?? m);
}

export function toHtmlDescription(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
}
