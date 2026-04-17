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

const MAX_LEN = 3900; // eBay limite 4000; margine di sicurezza

export function toHtmlDescription(text: string): string {
  const blocks = text.split(/\n{2,}/);
  const parts: string[] = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.replace(/\s+$/g, '').replace(/^\s+/g, '');
    if (!block) continue;

    const isSingleLine = !block.includes('\n');
    const letters = block.replace(/[^A-Za-zÀ-ÿ]/g, '');
    const upperLetters = block.replace(/[^A-ZÀ-Ý]/g, '');
    const isMostlyUpper = letters.length > 0 && upperLetters.length / letters.length >= 0.7;
    if (isSingleLine && block.length <= 60 && isMostlyUpper) {
      parts.push(`<h3>${escapeHtml(block)}</h3>`);
      continue;
    }

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((l) => /^[-•]\s+/.test(l));
    if (isList) {
      const items = lines.map((l) => {
        const content = l.replace(/^[-•]\s+/, '');
        const m = content.match(/^([^:]{1,40}):\s*(.*)$/);
        if (m) return { html: `<b>${escapeHtml(m[1])}:</b> ${escapeHtml(m[2])}` };
        return { html: escapeHtml(content) };
      });
      const hasLabels = items.every((it) => it.html.includes('<b>'));
      if (hasLabels && items.length >= 4) {
        const rows: string[] = [];
        for (let i = 0; i < items.length; i += 2) {
          const a = items[i].html;
          const b = items[i + 1]?.html ?? '';
          rows.push(`<tr><td width="50%">${a}</td><td width="50%">${b}</td></tr>`);
        }
        parts.push(`<table width="100%">${rows.join('')}</table>`);
      } else {
        const li = items.map((it) => `<li>${it.html}</li>`).join('');
        parts.push(`<ul>${li}</ul>`);
      }
      continue;
    }

    const para = block.split('\n').map((l) => escapeHtml(l.trim())).join('<br>');
    parts.push(`<p>${para}</p>`);
  }

  let html = parts.join('');
  if (html.length > MAX_LEN) {
    // tronca rozzamente a MAX_LEN e chiudi eventuali tag aperti non critici
    html = html.slice(0, MAX_LEN - 40) + '…</p>';
  }
  return html;
}
