'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PhotoEditorModal from './PhotoEditorModal';

export type FotoItem = { id?: number; url: string; copertina?: boolean };

interface Props {
  foto: FotoItem[];
  onChange: (next: FotoItem[]) => void;
  uploadBlob: (blob: Blob) => Promise<string>;
}

export default function PhotoGrid({ foto, onChange, uploadBlob }: Props) {
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function applyOrder(next: FotoItem[]) {
    onChange(next.map((f, i) => ({ ...f, copertina: i === 0 })));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = foto.findIndex((f) => f.url === active.id);
    const newIdx = foto.findIndex((f) => f.url === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    applyOrder(arrayMove(foto, oldIdx, newIdx));
  }

  function rimuovi(url: string) {
    applyOrder(foto.filter((f) => f.url !== url));
  }

  function portaInCima(url: string) {
    const idx = foto.findIndex((f) => f.url === url);
    if (idx <= 0) return;
    applyOrder(arrayMove(foto, idx, 0));
  }

  async function onEditorSave(oldUrl: string, blob: Blob) {
    const newUrl = await uploadBlob(blob);
    onChange(foto.map((f) => (f.url === oldUrl ? { ...f, url: newUrl } : f)));
  }

  if (foto.length === 0) return null;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={foto.map((f) => f.url)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-1 mt-2">
            {foto.map((f) => (
              <SortablePhoto
                key={f.url}
                foto={f}
                onEdit={() => setEditingUrl(f.url)}
                onRemove={() => rimuovi(f.url)}
                onCover={() => portaInCima(f.url)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editingUrl && (
        <PhotoEditorModal
          url={editingUrl}
          onClose={() => setEditingUrl(null)}
          onSave={async (blob) => {
            await onEditorSave(editingUrl, blob);
          }}
        />
      )}
    </>
  );
}

interface SortableProps {
  foto: FotoItem;
  onEdit: () => void;
  onRemove: () => void;
  onCover: () => void;
}

function SortablePhoto({ foto, onEdit, onRemove, onCover }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: foto.url });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className={`w-full aspect-square rounded overflow-hidden cursor-grab active:cursor-grabbing touch-none ${
          foto.copertina ? 'ring-2 ring-[#FF6600]' : ''
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
      </div>
      {foto.copertina && (
        <span className="absolute top-1 left-1 bg-[#FF6600] text-white text-[9px] font-bold uppercase px-1 rounded pointer-events-none">Cover</span>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 rounded pointer-events-none">
        <div className="flex gap-1 pointer-events-auto">
          <button type="button" onClick={onEdit} className="px-1.5 py-0.5 bg-white text-[10px] rounded">Modifica</button>
          {!foto.copertina && (
            <button type="button" onClick={onCover} className="px-1.5 py-0.5 bg-white text-[10px] rounded">Cover</button>
          )}
        </div>
        <button type="button" onClick={onRemove} className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded pointer-events-auto">✕</button>
      </div>
    </div>
  );
}
