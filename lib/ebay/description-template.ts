type RicambioData = {
  nome: string;
  titolo?: string | null;
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
  prezzo?: { toString(): string };
  foto?: Array<{ url: string; copertina: boolean }>;
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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderBodyHtml(text: string): string {
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
      parts.push(`<div class="sh">${escapeHtml(block)}</div>`);
      continue;
    }
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((l) => /^[-•]\s+/.test(l));
    if (isList) {
      const items = lines.map((l) => {
        const content = l.replace(/^[-•]\s+/, '');
        const m = content.match(/^([^:]{1,40}):\s*(.*)$/);
        if (m) return `<b>${escapeHtml(m[1])}:</b> ${escapeHtml(m[2])}`;
        return escapeHtml(content);
      });
      const hasLabels = items.every((it) => it.includes('<b>'));
      if (hasLabels && items.length >= 4) {
        const rows: string[] = [];
        for (let i = 0; i < items.length; i += 2) {
          rows.push(`<tr><td>${items[i]}</td><td>${items[i + 1] ?? ''}</td></tr>`);
        }
        parts.push(`<table class="specs">${rows.join('')}</table>`);
      } else {
        parts.push(`<ul>${items.map((it) => `<li>${it}</li>`).join('')}</ul>`);
      }
      continue;
    }
    const para = block.split('\n').map((l) => escapeHtml(l.trim())).join('<br>');
    parts.push(`<p>${para}</p>`);
  }
  return parts.join('');
}

const MAX_LEN = 3950;

interface BuildOpts {
  ricambio: RicambioData;
  demolitore: DemolitoreData;
  templateText: string | null;
  ebayUserId: string | null;
}

export function buildRichHtmlDescription({ ricambio, demolitore, templateText, ebayUserId }: BuildOpts): string {
  const title = escapeHtml((ricambio.titolo ?? ricambio.nome).slice(0, 80));
  const cover = ricambio.foto?.find((f) => f.copertina)?.url ?? ricambio.foto?.[0]?.url ?? '';
  const prezzo = ricambio.prezzo ? Number(ricambio.prezzo.toString()) : null;
  const storeUrl = ebayUserId
    ? `https://www.ebay.it/sch/${encodeURIComponent(ebayUserId)}/m.html`
    : 'https://www.ebay.it';
  const askUrl = ebayUserId
    ? `https://contact.ebay.it/ws/eBayISAPI.dll?ShowCoreAskSellerQuestion&requested=${encodeURIComponent(ebayUserId)}`
    : storeUrl;
  const ragione = escapeHtml(demolitore.ragioneSociale);

  const body = templateText ? renderBodyHtml(applicaTemplate(templateText, ricambio, demolitore)) : '';

  const style = `<style>.ad24{font-family:Arial,sans-serif;color:#333;max-width:880px;margin:0 auto}.ad24 .ttl{background:#003580;color:#fff;padding:14px;text-align:center;font-weight:bold;font-size:16px}.ad24 .g{width:100%;border-collapse:collapse}.ad24 .m{padding:16px;vertical-align:top;width:62%}.ad24 .s{padding:16px;vertical-align:top;width:38%;background:#f5f7fb}.ad24 img.c{max-width:100%;max-height:320px;border:1px solid #ddd;display:block;margin:0 auto}.ad24 .pr{border:2px solid #003580;padding:10px;text-align:center;background:#fff}.ad24 .pl{font-size:12px;color:#003580}.ad24 .pv{font-size:26px;color:#003580;font-weight:bold}.ad24 .ps{border-top:1px solid #003580;margin-top:6px;padding-top:4px;color:#003580;font-size:12px}.ad24 .btn{display:block;background:#003580;color:#fff;padding:9px;text-align:center;text-decoration:none;margin-top:7px;font-weight:bold}.ad24 .btn2{display:block;background:#003580;color:#fff;padding:6px;text-align:center;text-decoration:none;margin-top:4px;font-size:13px}.ad24 .w{margin-top:14px;padding-bottom:10px;border-bottom:1px solid #dde3ec}.ad24 .wt{font-weight:bold;color:#003580;font-size:13px;margin-bottom:3px}.ad24 .wd{font-size:11px;color:#555;line-height:1.45}.ad24 .sh{background:#003580;color:#fff;padding:6px 12px;margin:14px 0 8px;font-weight:bold;font-size:14px}.ad24 table.specs{border-collapse:collapse;width:100%;margin:8px 0}.ad24 table.specs td{padding:5px 10px;border-bottom:1px solid #eee;width:50%;font-size:13px}.ad24 p{margin:6px 0;font-size:13px;line-height:1.5}.ad24 ul{margin:6px 0 10px 20px;font-size:13px}.ad24 ul li{margin:3px 0}</style>`;

  const img = cover ? `<img src="${cover}" class="c">` : '';
  const prezzoStr = prezzo !== null ? `€ ${prezzo.toFixed(2).replace('.', ',')}` : '—';

  const widgets = `<div class="w"><div class="wt">Acquista in modo sicuro!</div><div class="wd">${ragione} è un venditore professionale specializzato in ricambi auto usati testati e garantiti.</div></div><div class="w"><div class="wt">Spedizione Rapida!</div><div class="wd">Spediamo entro 24-48h con tracciamento. Durante l'ordine scegli dove e a chi consegnare il ricambio.</div></div><div class="w"><div class="wt">Prodotti testati prima dello smontaggio!</div><div class="wd">Tutti i nostri ricambi usati vengono testati prima dello smontaggio per garantire il funzionamento.</div></div><div class="w"><div class="wt">Risparmi fino al 70%!</div><div class="wd">Ricambi usati originali e ricondizionati: risparmi e aiuti l'ambiente.</div></div>`;

  const html = `${style}<div class="ad24"><div class="ttl">${title}</div><table class="g"><tr><td class="m">${img}${body}</td><td class="s"><div class="pr"><div class="pl">PREZZO</div><div class="pv">${prezzoStr}</div><div class="ps">Spedizione inclusa!</div></div><a href="${storeUrl}" class="btn">Compralo Subito</a><a href="${storeUrl}" class="btn2">&rsaquo; Osserva &lsaquo;</a><a href="${askUrl}" class="btn2">&rsaquo; Fai una domanda &lsaquo;</a>${widgets}</td></tr></table></div>`;

  if (html.length <= MAX_LEN) return html;

  // Se sforiamo, tronca solo il body
  const available = MAX_LEN - (html.length - body.length) - 20;
  const truncatedBody = body.slice(0, Math.max(0, available)) + '…';
  return html.replace(body, truncatedBody);
}

// Legacy
export function toHtmlDescription(text: string): string {
  const html = renderBodyHtml(text);
  return html.length > MAX_LEN ? html.slice(0, MAX_LEN - 40) + '…' : html;
}
