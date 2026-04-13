import { NextRequest, NextResponse } from 'next/server';
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';

const TUTTI_RICAMBI: string[] = RICAMBI_GRUPPI.flatMap((g) => [...g.voci]);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function fetchImageAsBase64(url: string) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.error(`Fetch foto fallito (${res.status}):`, url);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    return {
      inline_data: {
        mime_type: mimeType.split(';')[0],
        data: base64,
      },
    };
  } catch (err) {
    console.error('Errore scaricamento foto:', url, err);
    return null;
  }
}

async function callGemini(imageContents: object[], prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [...imageContents, { text: prompt }],
        }],
      }),
    },
  );

  if (!res.ok) {
    const errData = await res.json();
    console.error('Errore Gemini:', errData);
    return null;
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key Gemini non configurata' }, { status: 500 });
    }

    const body = await req.json();
    const { fotoUrls, mode } = body as {
      fotoUrls: string[];
      mode?: 'ricambi' | 'veicolo' | 'completo';
    };

    if (!fotoUrls || fotoUrls.length === 0) {
      return NextResponse.json({ error: 'Nessuna foto fornita' }, { status: 400 });
    }

    // Scarica immagini
    const imageResults = await Promise.all(fotoUrls.slice(0, 5).map(fetchImageAsBase64));
    const imageContents = imageResults.filter((r) => r !== null);
    if (imageContents.length === 0) {
      return NextResponse.json({ error: 'Impossibile scaricare le foto' }, { status: 400 });
    }

    const analysisMode = mode ?? 'completo';

    // ── Riconoscimento veicolo ──
    let veicolo: { marca: string; modello: string; anno: number | null } | null = null;

    if (analysisMode === 'veicolo' || analysisMode === 'completo') {
      const veicoloPrompt = `Analizza queste foto di un veicolo in un piazzale di demolizione auto.

Identifica la MARCA e il MODELLO esatto dell'auto dalle foto. Se riesci, stima anche l'ANNO approssimativo di produzione basandoti sul design.

Rispondi SOLO con un oggetto JSON, senza altro testo. Formato:
{"marca": "Ford", "modello": "Ka", "anno": 2012}

Se non riesci a identificare l'anno, metti null:
{"marca": "Ford", "modello": "Ka", "anno": null}

Se non riesci a identificare il veicolo, rispondi:
{"marca": "", "modello": "", "anno": null}`;

      const veicoloText = await callGemini(imageContents, veicoloPrompt);
      if (veicoloText) {
        const jsonMatch = veicoloText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.marca) {
              veicolo = {
                marca: String(parsed.marca).trim(),
                modello: String(parsed.modello).trim(),
                anno: parsed.anno ? Number(parsed.anno) : null,
              };
            }
          } catch { /* ignore parse errors */ }
        }
      }
    }

    // ── Rilevamento ricambi ──
    let ricambi: string[] = [];

    if (analysisMode === 'ricambi' || analysisMode === 'completo') {
      const veicoloDesc = veicolo ? `${veicolo.marca} ${veicolo.modello}` : 'il veicolo';

      const ricambiPrompt = `Sei un esperto di autodemolizione italiana. Analizza queste foto di ${veicoloDesc} e identifica tutti i ricambi recuperabili.

COME RAGIONARE:
1. Guarda TUTTE le foto insieme per avere una visione completa del veicolo
2. Se vedi il lato frontale dell'auto e il cofano e presente e non distrutto → includi "Cofano"
3. Se vedi un faro intatto → includilo. Se vedi entrambi i fari → includi entrambi
4. Se vedi una portiera montata e non distrutta → includila
5. Se il veicolo appare intero o quasi intero, la maggior parte dei pezzi esterni sono recuperabili
6. Includi anche le parti che si deducono logicamente: se vedi il frontale intero con fari, paraurti e cofano tutti presenti, includili tutti

QUANDO ESCLUDERE un ricambio:
- Il pezzo e chiaramente MANCANTE (non c'e proprio)
- Il pezzo e visibilmente DISTRUTTO o ROTTO (faro spaccato, portiera accartocciata, vetro rotto)
- Il pezzo NON e visibile in nessuna foto E non si puo dedurre che sia presente

LISTA RICAMBI VALIDI (rispondi SOLO con nomi esatti da questa lista):
${TUTTI_RICAMBI.map((r) => `- ${r}`).join('\n')}

NOTE:
- Per parti interne (cruscotto, volante, sedili, airbag, ECU): includile SOLO se visibili nelle foto
- Per parti meccaniche (motore, cambio, radiatore, alternatore): includile SOLO se il vano motore e visibile
- Per parti esterne (carrozzeria, fari, specchietti, vetri): includile se il lato corrispondente del veicolo e visibile e il pezzo appare intatto
- Freni e sospensioni: includili SOLO se le ruote/sottoscocca sono visibili

Rispondi SOLO con un array JSON di stringhe, senza altro testo. Esempio:
["Cofano", "Paraurti anteriore", "Faro ant. sinistro", "Faro ant. destro", "Parafango ant. sinistro"]`;

      const ricambiText = await callGemini(imageContents, ricambiPrompt);
      if (ricambiText) {
        const jsonMatch = ricambiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as string[];
            ricambi = parsed.filter((r: string) => TUTTI_RICAMBI.includes(r));
          } catch { /* ignore parse errors */ }
        }
      }
    }

    return NextResponse.json({ veicolo, ricambi });
  } catch (err) {
    console.error('Errore rileva ricambi:', err);
    return NextResponse.json(
      { error: 'Errore durante l\'analisi delle foto' },
      { status: 500 },
    );
  }
}
