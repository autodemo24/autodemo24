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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function toHtmlDescription(text: string): string {
  const blocks = text.split(/\n{2,}/);
  const parts: string[] = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.replace(/\s+$/g, '').replace(/^\s+/g, '');
    if (!block) continue;

    // Header: singola riga, prevalentemente maiuscola, corta
    const isSingleLine = !block.includes('\n');
    const letters = block.replace(/[^A-Za-zÀ-ÿ]/g, '');
    const upperLetters = block.replace(/[^A-ZÀ-Ý]/g, '');
    const isMostlyUpper = letters.length > 0 && upperLetters.length / letters.length >= 0.7;
    if (isSingleLine && block.length <= 60 && isMostlyUpper) {
      parts.push(
        `<h2 style="font-size:17px;font-weight:bold;color:#111;margin:22px 0 10px;padding-bottom:6px;border-bottom:1px solid #003580;letter-spacing:0.3px;">${escapeHtml(block)}</h2>`,
      );
      continue;
    }

    // Lista: tutte le righe iniziano con "- " o "• "
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((l) => /^[-•]\s+/.test(l));
    if (isList) {
      const items = lines
        .map((l) => {
          const content = l.replace(/^[-•]\s+/, '');
          // Se contiene "label: value", renderizza label in grassetto
          const m = content.match(/^([^:]{1,40}):\s*(.*)$/);
          if (m) {
            return `<li style="margin:3px 0;"><strong>${escapeHtml(m[1])}:</strong> ${escapeHtml(m[2])}</li>`;
          }
          return `<li style="margin:3px 0;">${escapeHtml(content)}</li>`;
        })
        .join('');
      parts.push(`<ul style="margin:8px 0 14px;padding-left:22px;">${items}</ul>`);
      continue;
    }

    // Paragrafo normale: ogni linea su una nuova riga via <br/>
    const html = block.split('\n').map((l) => escapeHtml(l.trim())).join('<br/>');
    parts.push(`<p style="margin:8px 0;line-height:1.55;">${html}</p>`);
  }

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#333;max-width:820px;">${parts.join('')}</div>`;
}
