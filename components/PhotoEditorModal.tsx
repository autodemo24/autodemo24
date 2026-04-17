'use client';

import { useCallback, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

interface Props {
  url: string;
  onClose: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
}

export default function PhotoEditorModal({ url, onClose, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  function replaceUrl(newUrl: string) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = newUrl.startsWith('blob:') ? newUrl : null;
    setCurrentUrl(newUrl);
  }

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setCropArea(areaPx);
  }, []);

  async function rimuoviSfondo() {
    setError(null);
    setBgRemoving(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const resp = await fetch(currentUrl);
      const blob = await resp.blob();
      const outBlob = await removeBackground(blob);
      replaceUrl(URL.createObjectURL(outBlob));
      setRotation(0);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (e) {
      console.error(e);
      setError('Rimozione sfondo non riuscita');
    } finally {
      setBgRemoving(false);
    }
  }

  async function salva() {
    if (!cropArea) return;
    setSaving(true); setError(null);
    try {
      const blob = await renderCroppedImage(currentUrl, cropArea, rotation);
      await onSave(blob);
      onClose();
    } catch (e) {
      console.error(e);
      setError('Impossibile salvare');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-base font-semibold">Modifica foto</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded hover:bg-gray-100" aria-label="Chiudi">✕</button>
        </div>

        <div className="relative flex-1 bg-gray-900" style={{ minHeight: 360 }}>
          <Cropper
            image={currentUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            restrictPosition={false}
          />
        </div>

        <div className="px-4 py-3 border-t space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRotation((r) => r - 90)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">↺ Ruota sx</button>
            <button type="button" onClick={() => setRotation((r) => r + 90)} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">↻ Ruota dx</button>
            <button type="button" onClick={rimuoviSfondo} disabled={bgRemoving} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">
              {bgRemoving ? 'Rimozione sfondo…' : '✨ Rimuovi sfondo'}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-gray-500">Zoom</label>
              <input type="range" min={1} max={4} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">Annulla</button>
            <button type="button" onClick={salva} disabled={saving || bgRemoving} className="px-4 py-1.5 text-sm rounded bg-[#003580] text-white hover:bg-[#002a66] disabled:opacity-50">
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCroppedImage(src: string, area: Area, rotation: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const bW = img.width * cos + img.height * sin;
      const bH = img.width * sin + img.height * cos;

      const canvas = document.createElement('canvas');
      canvas.width = bW;
      canvas.height = bH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.translate(bW / 2, bH / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const out = document.createElement('canvas');
      out.width = area.width;
      out.height = area.height;
      const octx = out.getContext('2d');
      if (!octx) return reject(new Error('canvas'));
      octx.drawImage(canvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

      out.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('blob'));
      }, 'image/webp', 0.9);
    };
    img.onerror = () => reject(new Error('load'));
    img.src = src;
  });
}
