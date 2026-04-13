'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CLASSI = [
  { id: 'faro_ant_sx', nome: 'Faro ant. sinistro', colore: '#ef4444' },
  { id: 'faro_ant_dx', nome: 'Faro ant. destro', colore: '#f97316' },
  { id: 'parafango_ant_sx', nome: 'Parafango ant. sinistro', colore: '#eab308' },
  { id: 'parafango_ant_dx', nome: 'Parafango ant. destro', colore: '#84cc16' },
  { id: 'paraurti_ant', nome: 'Paraurti anteriore', colore: '#22c55e' },
  { id: 'paraurti_post', nome: 'Paraurti posteriore', colore: '#14b8a6' },
  { id: 'cofano', nome: 'Cofano', colore: '#06b6d4' },
  { id: 'portiera_ant_sx', nome: 'Portiera ant. sinistra', colore: '#3b82f6' },
  { id: 'portiera_ant_dx', nome: 'Portiera ant. destra', colore: '#8b5cf6' },
  { id: 'specchietto_sx', nome: 'Specchietto sinistro', colore: '#ec4899' },
];

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

    // Carica immagine
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      // Riprova senza crossOrigin
      const img2 = new Image();
      img2.onload = () => {
        imgRef.current = img2;
        setImgLoaded(true);
      };
      img2.src = selectedFoto.url;
    };
    img.src = selectedFoto.url;
  }, [selectedFoto]);

  // Disegna canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const container = containerRef.current;
    if (!container) return;

    const maxW = container.clientWidth - 8;
    const maxH = window.innerHeight * 0.65;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Immagine
    ctx.drawImage(img, 0, 0, w, h);

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
    draw();
  }, [draw]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

    // Controlla se click su X di eliminazione
    for (const box of boxes) {
      const bx = box.x * canvas.width;
      const by = box.y * canvas.height;
      const bw = box.w * canvas.width;
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

    const x = Math.min(startPos.x, currentPos.x) / canvas.width;
    const y = Math.min(startPos.y, currentPos.y) / canvas.height;
    const w = Math.abs(currentPos.x - startPos.x) / canvas.width;
    const h = Math.abs(currentPos.y - startPos.y) / canvas.height;

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
    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-2 h-full">

      {/* ── Colonna SX: Lista foto ── */}
      <div className="space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Foto ({fotos.length})
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
              <img src={foto.url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
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

      {/* ── Colonna DX: Canvas + Classi ── */}
      <div className="flex flex-col min-h-0">
        {!selectedFoto ? (
          <div className="bg-white rounded-lg shadow-sm flex items-center justify-center flex-1">
            <p className="text-sm text-gray-400">Seleziona una foto per iniziare</p>
          </div>
        ) : (
          <>
            {/* Canvas + classi a destra */}
            <div className="flex gap-2 flex-1 min-h-0">
              {/* Canvas */}
              <div ref={containerRef} className="bg-white rounded-lg shadow-sm flex-1 min-h-0 p-1">
                {!imgLoaded && (
                  <div className="flex items-center justify-center h-40">
                    <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={`cursor-crosshair block rounded mx-auto ${imgLoaded ? '' : 'hidden'}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => { if (drawing) handleMouseUp(); }}
                />
              </div>

              {/* Classi a destra */}
              <div className="w-[130px] shrink-0 bg-white rounded-lg shadow-sm p-1.5 overflow-y-auto flex flex-col gap-0.5">
                {CLASSI.map((cls) => {
                  const usata = boxes.some((b) => b.classe === cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClasse(cls.id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                        selectedClasse === cls.id
                          ? 'text-white'
                          : usata
                            ? 'text-gray-700 bg-gray-50'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={selectedClasse === cls.id ? { backgroundColor: cls.colore } : undefined}
                    >
                      {usata ? (
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke={selectedClasse === cls.id ? 'white' : cls.colore} strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cls.colore }} />
                      )}
                      {cls.nome}
                    </button>
                  );
                })}
              </div>
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
          </>
        )}
      </div>
    </div>
  );
}
