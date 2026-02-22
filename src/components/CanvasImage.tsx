import React, { useCallback, useRef } from 'react';
import type { CanvasImage } from '@/types';
import { useDiagram } from '@/store/DiagramContext';
import { screenToCanvas } from '@/utils/canvas';
import { API } from '@/utils/api';

interface CanvasImageProps {
  image: CanvasImage;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const CanvasImageComponent = React.memo(function CanvasImageComponent({ image, containerRef }: CanvasImageProps) {
  const { state, dispatch } = useDiagram();
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-image-resize')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = screenToCanvas(e.clientX, e.clientY, rect, state.panX, state.panY, state.scale);
    dragRef.current = { dragging: true, offsetX: p.x - image.x, offsetY: p.y - image.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const pp = screenToCanvas(ev.clientX, ev.clientY, r, state.panX, state.panY, state.scale);
      dispatch({ type: 'MOVE_IMAGE', payload: { id: image.id, x: pp.x - dragRef.current.offsetX, y: pp.y - dragRef.current.offsetY } });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [image.id, image.x, image.y, state.panX, state.panY, state.scale, dispatch, containerRef]);

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startW = image.width;
    const startH = image.height;
    const startX = e.clientX;
    const startY = e.clientY;
    const aspect = startW / startH;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / state.scale;
      const nw = Math.max(100, startW + dx);
      const nh = nw / aspect;
      dispatch({ type: 'RESIZE_IMAGE', payload: { id: image.id, width: nw, height: nh } });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [image.id, image.width, image.height, state.scale, dispatch]);

  return (
    <div
      className="canvas-image"
      id={'img-' + image.id}
      style={{ left: image.x, top: image.y, width: image.width, height: image.height }}
      onMouseDown={handleMouseDown}
    >
      <button className="canvas-image-delete" onClick={() => dispatch({ type: 'DELETE_IMAGE', payload: image.id })}>✕</button>
      <img src={API.imageUrl(image.imageId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      <div className="canvas-image-resize" onMouseDown={handleResize} />
    </div>
  );
});
