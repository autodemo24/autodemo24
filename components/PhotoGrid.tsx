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
          <div className="mt-2 space-y-1">
            <SortablePhoto
              key={foto[0].url}
              foto={foto[0]}
              size="cover"
              onEdit={() => setEditingUrl(foto[0].url)}
              onRemove={() => rimuovi(foto[0].url)}
              onCover={() => portaInCima(foto[0].url)}
            />
            {foto.length > 1 && (
              <div className="grid grid-cols-3 gap-1">
                {foto.slice(1).map((f) => (
                  <SortablePhoto
                    key={f.url}
                    foto={f}
                    size="thumb"
                    onEdit={() => setEditingUrl(f.url)}
                    onRemove={() => rimuovi(f.url)}
                    onCover={() => portaInCima(f.url)}
                  />
                ))}
              </div>
            )}
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
  size: 'cover' | 'thumb';
  onEdit: () => void;
  onRemove: () => void;
  onCover: () => void;
}

function SortablePhoto({ foto, size, onEdit, onRemove, onCover }: SortableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: foto.url });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isCover = size === 'cover';

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className={`w-full ${isCover ? 'aspect-[4/3]' : 'aspect-square'} rounded overflow-hidden cursor-grab active:cursor-grabbing touch-none bg-gray-100 ${
          foto.copertina ? 'ring-2 ring-[#FF6600]' : ''
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url} alt="" loading="lazy" decoding="async" className={`w-full h-full ${isCover ? 'object-contain' : 'object-cover'}`} />
      </div>
      {foto.copertina && (
        <span className={`absolute top-1 left-1 bg-[#FF6600] text-white font-bold uppercase rounded pointer-events-none ${isCover ? 'text-[11px] px-2 py-0.5' : 'text-[9px] px-1'}`}>Cover</span>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 rounded pointer-events-none">
        <div className="flex gap-1 pointer-events-auto">
          <button type="button" onClick={onEdit} className={`bg-white rounded ${isCover ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'}`}>Modifica</button>
          {!foto.copertina && (
            <button type="button" onClick={onCover} className={`bg-white rounded ${isCover ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'}`}>Cover</button>
          )}
        </div>
        <button type="button" onClick={onRemove} className={`bg-red-600 text-white rounded pointer-events-auto ${isCover ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'}`}>✕ Rimuovi</button>
      </div>
    </div>
  );
}
