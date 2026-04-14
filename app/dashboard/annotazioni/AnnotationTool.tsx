'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const COLORI_CATEGORIA: Record<string, string> = {
  'Meccanica': '#ef4444',
  'Carrozzeria': '#f97316',
  'Illuminazione': '#eab308',
  'Vetri': '#06b6d4',
  'Interni': '#8b5cf6',
  'Elettronica': '#3b82f6',
  'Climatizzazione': '#14b8a6',
  'Ruote e freni': '#ec4899',
};

// Genera un ID dalla voce: "Faro anteriore sinistro" -> "faro_anteriore_sinistro"
function vocaToId(voce: string): string {
  return voce.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

// Importa ricambi dal file condiviso
import { RICAMBI_GRUPPI } from '../../../lib/ricambi';

// Costruisci lista classi da RICAMBI_GRUPPI
const CLASSI = RICAMBI_GRUPPI.flatMap((g) =>
  g.voci.map((voce) => ({
    id: vocaToId(voce),
    nome: voce,
    colore: COLORI_CATEGORIA[g.categoria] ?? '#666',
    categoria: g.categoria,
  }))
);

type Box = {
  id: string;
  classe: string;
  x: number; y: number; w: number; h: number; // normalizzate 0-1
};

type FotoInfo = {
  url: string;
  veicolo: string;
  targa: string;
  annotazioni: number;
};

interface Props {
  fotos: FotoInfo[];
  totalAnnotazioni: number;
}

export default function AnnotationTool({ fotos, totalAnnotazioni }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const [selectedFoto, setSelectedFoto] = useState<FotoInfo | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedClasse, setSelectedClasse] = useState(CLASSI[0].id);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [annotationCounts, setAnnotationCounts] = useState<Map<string, number>>(
    new Map(fotos.map((f) => [f.url, f.annotazioni]))
  );

  // Training state
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [trainingRunning, setTrainingRunning] = useState(false);
  const [trainingError, setTrainingError] = useState('');

  const MIN_ANNOTATIONS = 200;
  const canTrain = totalAnnotazioni >= MIN_ANNOTATIONS && !trainingRunning;

  const handleStartTraining = async () => {
    setTrainingRunning(true);
    setTrainingError('');
    setTrainingStatus('Avvio training...');
    try {
      const res = await fetch('/api/ai-training', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setTrainingError(data.error ?? 'Errore avvio training');
        setTrainingRunning(false);
        return;
      }
      setTrainingStatus('Training avviato! Controlla lo stato qui sotto.');
      // Poll status ogni 10 secondi
      const interval = setInterval(async () => {
        try {
          const sr = await fetch('/api/ai-training');
          const sd = await sr.json();
          setTrainingStatus(sd.progress || '');
          if (!sd.running) {
            clearInterval(interval);
            setTrainingRunning(false);
            if (sd.error) setTrainingError(sd.error);
            else setTrainingStatus('Training completato! Il modello e stato aggiornato.');
          }
        } catch { /* ignore */ }
      }, 10000);
    } catch {
      setTrainingError('Microservizio AI non raggiungibile. Avvia il server prima di lanciare il training.');
      setTrainingRunning(false);
    }
  };

  // Carica annotazioni quando si seleziona una foto
  useEffect(() => {
    if (!selectedFoto) return;
    setImgLoaded(false);
    setSaved(false);
    fetch(`/api/annotations?fotoUrl=${encodeURIComponent(selectedFoto.url)}`)
      .then((r) => r.json())
      .then((data) => {
        setBoxes(
          data.map((a: { classe: string; x: number; y: number; w: number; h: number }) => ({
            id: Math.random().toString(36).slice(2),
            classe: a.classe,
            x: a.x, y: a.y, w: a.w, h: a.h,
          }))
        );
      })
      .catch(() => setBoxes([]));

    // Carica immagine via proxy (per bypassare CORS e permettere autocrop)
    const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(selectedFoto.url)}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      cropRef.current = computeAutoCrop(img);
      setImgLoaded(true);
    };
    img.onerror = () => {
      // Fallback: carica direttamente senza proxy (niente autocrop)
      const img2 = new Image();
      img2.onload = () => {
        imgRef.current = img2;
        cropRef.current = null;
        setImgLoaded(true);
      };
      img2.src = selectedFoto.url;
    };
    img.src = proxiedUrl;
  }, [selectedFoto]);

  // Rileva bounding box della parte non-bianca dell'immagine
  const computeAutoCrop = (img: HTMLImageElement): { x: number; y: number; w: number; h: number } | null => {
    try {
      const tmp = document.createElement('canvas');
      // Downsample per velocita
      const maxDim = 200;
      const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      tmp.width = Math.round(img.naturalWidth * ratio);
      tmp.height = Math.round(img.naturalHeight * ratio);
      const tctx = tmp.getContext('2d');
      if (!tctx) return null;
      tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
      const data = tctx.getImageData(0, 0, tmp.width, tmp.height).data;

      let minX = tmp.width, minY = tmp.height, maxX = 0, maxY = 0;
      const WHITE_THRESHOLD = 240; // pixel considerato "bianco" se R,G,B > 240
      for (let y = 0; y < tmp.height; y++) {
        for (let x = 0; x < tmp.width; x++) {
          const i = (y * tmp.width + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const isWhite = r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD;
          if (!isWhite) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX <= minX || maxY <= minY) return null;

      // Espandi di un 5% per margine
      const padX = (maxX - minX) * 0.05;
      const padY = (maxY - minY) * 0.05;
      const cx = Math.max(0, minX - padX) / tmp.width;
      const cy = Math.max(0, minY - padY) / tmp.height;
      const cw = Math.min(tmp.width, maxX + padX) / tmp.width - cx;
      const ch = Math.min(tmp.height, maxY + padY) / tmp.height - cy;

      // Se il crop e > 90% dell'immagine, non vale la pena
      if (cw > 0.9 && ch > 0.9) return null;

      return {
        x: cx * img.naturalWidth,
        y: cy * img.naturalHeight,
        w: cw * img.naturalWidth,
        h: ch * img.naturalHeight,
      };
    } catch {
      return null;
    }
  };

  // Disegna canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const container = containerRef.current;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const maxW = container.clientWidth - 24;
    const maxH = window.innerHeight - 150;

    // Usa crop se disponibile, altrimenti l'intera immagine
    const crop = cropRef.current ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const scale = Math.min(maxW / crop.w, maxH / crop.h);
    const w = crop.w * scale;
    const h = crop.h * scale;

    // Canvas ad alta risoluzione per evitare sgranatura
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Disegna solo la porzione cropata
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);

    // Box salvati
    for (const box of boxes) {
      const cls = CLASSI.find((c) => c.id === box.classe);
      const color = cls?.colore ?? '#fff';
      const bx = box.x * w;
      const by = box.y * h;
      const bw = box.w * w;
      const bh = box.h * h;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      // Label
      const label = cls?.nome ?? box.classe;
      ctx.font = 'bold 11px sans-serif';
      const textW = ctx.measureText(label).width + 8;
      ctx.fillStyle = color;
      ctx.fillRect(bx, by - 18, textW, 18);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, bx + 4, by - 5);

      // X per eliminare
      const delX = bx + bw - 16;
      const delY = by;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(delX, delY, 16, 16);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(delX + 4, delY + 4); ctx.lineTo(delX + 12, delY + 12);
      ctx.moveTo(delX + 12, delY + 4); ctx.lineTo(delX + 4, delY + 12);
      ctx.stroke();
    }

    // Box in corso di disegno
    if (drawing && startPos && currentPos) {
      const cls = CLASSI.find((c) => c.id === selectedClasse);
      ctx.strokeStyle = cls?.colore ?? '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        startPos.x, startPos.y,
        currentPos.x - startPos.x, currentPos.y - startPos.y
      );
      ctx.setLineDash([]);
    }
  }, [boxes, drawing, startPos, currentPos, selectedClasse, imgLoaded]);

  useEffect(() => {
    // Disegna dopo il layout
    const raf = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  // Resize handler: osserva sia la finestra che il container
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => draw());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [draw]);

  // Mouse handlers
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current!;
    const pos = getCanvasPos(e);

    // Dimensioni logiche (CSS pixels) del canvas
    const logicalW = canvas.getBoundingClientRect().width;
    const logicalH = canvas.getBoundingClientRect().height;

    // Controlla se click su X di eliminazione
    for (const box of boxes) {
      const bx = box.x * logicalW;
      const by = box.y * logicalH;
      const bw = box.w * logicalW;
      const delX = bx + bw - 16;
      const delY = by;
      if (pos.x >= delX && pos.x <= delX + 16 && pos.y >= delY && pos.y <= delY + 16) {
        setBoxes((prev) => prev.filter((b) => b.id !== box.id));
        setSaved(false);
        return;
      }
    }

    setDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);
    setSaved(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    setCurrentPos(getCanvasPos(e));
  };

  const handleMouseUp = () => {
    if (!drawing || !startPos || !currentPos) { setDrawing(false); return; }
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const logicalW = rect.width;
    const logicalH = rect.height;

    const x = Math.min(startPos.x, currentPos.x) / logicalW;
    const y = Math.min(startPos.y, currentPos.y) / logicalH;
    const w = Math.abs(currentPos.x - startPos.x) / logicalW;
    const h = Math.abs(currentPos.y - startPos.y) / logicalH;

    // Ignora rettangoli troppo piccoli (click accidentali)
    if (w > 0.01 && h > 0.01) {
      setBoxes((prev) => [...prev, {
        id: Math.random().toString(36).slice(2),
        classe: selectedClasse,
        x, y, w, h,
      }]);
    }

    setDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Salva
  const handleSave = async () => {
    if (!selectedFoto) return;
    setSaving(true);
    try {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fotoUrl: selectedFoto.url,
          annotations: boxes.map((b) => ({
            classe: b.classe, x: b.x, y: b.y, w: b.w, h: b.h,
          })),
        }),
      });
      setSaved(true);
      setAnnotationCounts((prev) => {
        const next = new Map(prev);
        next.set(selectedFoto.url, boxes.length);
        return next;
      });
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">

      {/* ── Colonna SX: Lista foto ── */}
      <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Foto da annotare ({fotos.length})
        </p>
        {fotos.map((foto) => {
          const count = annotationCounts.get(foto.url) ?? 0;
          const isSelected = selectedFoto?.url === foto.url;
          return (
            <button
              key={foto.url}
              type="button"
              onClick={() => setSelectedFoto(foto)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                isSelected ? 'bg-[#003580] text-white' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto.url} alt="" className="w-14 h-14 rounded object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {foto.veicolo}
                </p>
                <p className={`text-[10px] truncate ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                  {foto.targa}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {count > 0 ? (
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-green-300' : 'text-green-600'}`}>
                      {count} annotazioni
                    </span>
                  ) : (
                    <span className={`text-[10px] ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
                      Non annotata
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {fotos.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nessuna foto disponibile. Pubblica un veicolo con foto per iniziare.
          </div>
        )}
      </div>

      {/* ── Colonna DX: Canvas + Controlli ── */}
      <div className="lg:col-span-5">
        {!selectedFoto ? (
          <div className="bg-white rounded-xl shadow-sm flex items-center justify-center h-96">
            <p className="text-sm text-gray-400">Seleziona una foto dalla lista per iniziare ad annotare</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toolbar classi (raggruppate per categoria) */}
            <div className="bg-white rounded-xl shadow-sm p-3 space-y-2">
              {RICAMBI_GRUPPI.map((gruppo) => {
                const vociGruppo = CLASSI.filter((c) => c.categoria === gruppo.categoria);
                return (
                  <div key={gruppo.categoria} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-1">{gruppo.categoria}</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {vociGruppo.map((cls) => {
                        const usata = boxes.some((b) => b.classe === cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => setSelectedClasse(cls.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                              selectedClasse === cls.id
                                ? 'text-white shadow-sm'
                                : usata
                                  ? 'text-gray-700 bg-gray-100'
                                  : 'text-gray-600 bg-gray-50 hover:bg-gray-200'
                            }`}
                            style={selectedClasse === cls.id ? { backgroundColor: cls.colore } : undefined}
                          >
                            {usata && (
                              <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={selectedClasse === cls.id ? 'white' : cls.colore} strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {cls.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canvas */}
            <div ref={containerRef} className="bg-white rounded-xl shadow-sm p-3">
              {!imgLoaded && (
                <div className="flex items-center justify-center h-64">
                  <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={`cursor-crosshair mx-auto block rounded ${imgLoaded ? '' : 'hidden'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { if (drawing) handleMouseUp(); }}
              />
            </div>

            {/* Footer compatto: chips + salva */}
            <div className="mt-2 bg-white rounded-lg shadow-sm px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                {boxes.length === 0 ? (
                  <p className="text-[10px] text-gray-400">Disegna rettangoli sulla foto</p>
                ) : (
                  boxes.map((box) => {
                    const cls = CLASSI.find((c) => c.id === box.classe);
                    return (
                      <span key={box.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                        style={{ backgroundColor: cls?.colore ?? '#666' }}>
                        {cls?.nome ?? box.classe}
                        <button type="button" onClick={() => { setBoxes((prev) => prev.filter((b) => b.id !== box.id)); setSaved(false); }}
                          className="ml-0.5 hover:text-white/70">&times;</button>
                      </span>
                    );
                  })
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Training progress mini */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${totalAnnotazioni >= MIN_ANNOTATIONS ? 'bg-green-500' : 'bg-[#003580]'}`}
                      style={{ width: `${Math.min(100, (totalAnnotazioni / MIN_ANNOTATIONS) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400">{totalAnnotazioni}/{MIN_ANNOTATIONS}</span>
                  {totalAnnotazioni >= MIN_ANNOTATIONS && (
                    <button
                      type="button"
                      onClick={handleStartTraining}
                      disabled={trainingRunning}
                      className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {trainingRunning ? 'Training...' : 'Train'}
                    </button>
                  )}
                </div>
                {trainingError && <span className="text-[9px] text-red-500">{trainingError}</span>}
                {trainingStatus && !trainingError && <span className="text-[9px] text-[#003580]">{trainingStatus}</span>}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-[#FF6600] text-white hover:bg-orange-600 disabled:opacity-50'
                  }`}
                >
                  {saving ? 'Salvo...' : saved ? 'Salvato' : `Salva (${boxes.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
