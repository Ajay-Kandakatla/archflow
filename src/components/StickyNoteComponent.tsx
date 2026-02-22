import React, { useCallback, useRef } from 'react';
import type { StickyNote, PortPosition } from '@/types';
import { useDiagram } from '@/store/DiagramContext';
import { screenToCanvas } from '@/utils/canvas';

interface StickyNoteProps {
  note: StickyNote;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isMultiSelected?: boolean;
  onMultiDragStart?: (e: React.MouseEvent) => void;
  onPortDragStart?: (noteId: number, port: PortPosition, startPos: { x: number; y: number }, endpointType: 'note') => void;
}

export const StickyNoteComponent = React.memo(function StickyNoteComponent({ note, containerRef, isMultiSelected, onMultiDragStart, onPortDragStart }: StickyNoteProps) {
  const { state, dispatch } = useDiagram();
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const panScaleRef = useRef({ panX: state.panX, panY: state.panY, scale: state.scale });
  panScaleRef.current = { panX: state.panX, panY: state.panY, scale: state.scale };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.closest('.sticky-note-resize') || target.closest('.note-port')) return;
    e.stopPropagation();

    // Ctrl+Click (or Cmd+Click) = toggle individual selection
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'TOGGLE_SELECT_NOTE', payload: note.id });
      return;
    }

    if (isMultiSelected && onMultiDragStart) {
      onMultiDragStart(e);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { panX, panY, scale } = panScaleRef.current;
    const p = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);
    dragRef.current = { dragging: true, offsetX: p.x - note.x, offsetY: p.y - note.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const { panX: px, panY: py, scale: s } = panScaleRef.current;
      const pp = screenToCanvas(ev.clientX, ev.clientY, r, px, py, s);
      dispatch({ type: 'MOVE_NOTE', payload: { id: note.id, x: pp.x - dragRef.current.offsetX, y: pp.y - dragRef.current.offsetY } });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [note.id, note.x, note.y, dispatch, containerRef, isMultiSelected, onMultiDragStart]);

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startW = note.width || 200;
    const startH = note.height || 150;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const dxr = (ev.clientX - startX) / state.scale;
      const dyr = (ev.clientY - startY) / state.scale;
      dispatch({ type: 'RESIZE_NOTE', payload: { id: note.id, width: Math.max(150, startW + dxr), height: Math.max(100, startH + dyr) } });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [note.id, note.width, note.height, state.scale, dispatch]);

  const handlePortMouseDown = useCallback((e: React.MouseEvent, port: PortPosition) => {
    e.stopPropagation();
    const w = note.width || 200;
    const h = note.height || 150;
    let pos = { x: note.x, y: note.y };
    switch (port) {
      case 'top': pos = { x: note.x + w / 2, y: note.y }; break;
      case 'bottom': pos = { x: note.x + w / 2, y: note.y + h }; break;
      case 'left': pos = { x: note.x, y: note.y + h / 2 }; break;
      case 'right': pos = { x: note.x + w, y: note.y + h / 2 }; break;
    }
    onPortDragStart?.(note.id, port, pos, 'note');
  }, [note.id, note.x, note.y, note.width, note.height, onPortDragStart]);

  return (
    <div
      className={`sticky-note ${note.color} ${isMultiSelected ? 'multi-selected' : ''}`}
      id={'note-' + note.id}
      style={{ left: note.x, top: note.y, width: note.width, height: note.height }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection ports */}
      {(['top', 'bottom', 'left', 'right'] as PortPosition[]).map(port => (
        <div key={port} className={`note-port node-port ${port}`} data-port={port}
          onMouseDown={(e) => handlePortMouseDown(e, port)} />
      ))}
      <button className="sticky-delete" onClick={() => dispatch({ type: 'DELETE_NOTE', payload: note.id })}>✕</button>
      <textarea className="sticky-note-text" defaultValue={note.text}
        style={{
          fontSize: note.textFormat?.fontSize ? `${note.textFormat.fontSize}px` : undefined,
          fontWeight: note.textFormat?.bold ? 700 : undefined,
          fontStyle: note.textFormat?.italic ? 'italic' : undefined,
        }}
        onChange={(e) => dispatch({ type: 'UPDATE_NOTE_TEXT', payload: { id: note.id, text: e.target.value } })} />
      <div className="sticky-note-resize" onMouseDown={handleResize} />
    </div>
  );
});
