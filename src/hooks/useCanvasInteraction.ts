import { useCallback, useRef, useEffect } from 'react';
import type { PortPosition, ToolMode } from '@/types';
import { screenToCanvas } from '@/utils/canvas';

interface UseCanvasInteractionOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  panX: number;
  panY: number;
  currentTool: ToolMode;
  onZoom: (scale: number, panX: number, panY: number) => void;
  onPan: (panX: number, panY: number) => void;
  onDropNode: (type: string, x: number, y: number) => void;
  onDropGroup: (color: string, x: number, y: number) => void;
  onCanvasClick: (x: number, y: number) => void;
  onContextMenu: (screenX: number, screenY: number, canvasX: number, canvasY: number) => void;
  onMarqueeStart: (canvasX: number, canvasY: number) => void;
  onMarqueeMove: (canvasX: number, canvasY: number) => void;
  onMarqueeEnd: () => void;
}

export function useCanvasInteraction({
  containerRef, scale, panX, panY, currentTool,
  onZoom, onPan, onDropNode, onDropGroup, onCanvasClick, onContextMenu,
  onMarqueeStart, onMarqueeMove, onMarqueeEnd,
}: UseCanvasInteractionOptions) {
  const panningRef = useRef({ isPanning: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const touchRef = useRef({ lastDist: 0, lastScale: 0 });

  // Wheel handler for zoom/pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = Math.min(3, Math.max(0.15, scale * delta));
        const ratio = newScale / scale;
        const newPanX = mx - ratio * (mx - panX);
        const newPanY = my - ratio * (my - panY);
        onZoom(newScale, newPanX, newPanY);
      } else {
        // Pan
        onPan(panX - e.deltaX, panY - e.deltaY);
      }
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [containerRef, scale, panX, panY, onZoom, onPan]);

  // Touch handlers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
        touchRef.current.lastScale = scale;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / touchRef.current.lastDist;
        if (Math.abs(ratio - 1) < 0.02) return; // threshold
        const newScale = Math.min(3, Math.max(0.15, touchRef.current.lastScale * ratio));
        const rect = el.getBoundingClientRect();
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        const r = newScale / scale;
        onZoom(newScale, mx - r * (mx - panX), my - r * (my - panY));
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [containerRef, scale, panX, panY, onZoom]);

  // Middle-click or right-click panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle click = pan
      e.preventDefault();
      panningRef.current = { isPanning: true, startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
      const onMove = (ev: MouseEvent) => {
        if (!panningRef.current.isPanning) return;
        onPan(
          panningRef.current.startPanX + (ev.clientX - panningRef.current.startX),
          panningRef.current.startPanY + (ev.clientY - panningRef.current.startY),
        );
      };
      const onUp = () => {
        panningRef.current.isPanning = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  }, [panX, panY, onPan]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only respond if clicking on canvas background (grid-bg or canvas itself)
    if (!target.classList.contains('grid-bg') && !target.classList.contains('canvas')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);
    onCanvasClick(p.x, p.y);
  }, [containerRef, panX, panY, scale, onCanvasClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);
    onContextMenu(e.clientX, e.clientY, p.x, p.y);
  }, [containerRef, panX, panY, scale, onContextMenu]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);

    const type = e.dataTransfer.getData('componentType');
    if (type) {
      onDropNode(type, p.x - 85, p.y - 45); // Center the node on drop point
      return;
    }

    const groupColor = e.dataTransfer.getData('groupColor');
    if (groupColor) {
      onDropGroup(groupColor, p.x - 200, p.y - 150); // Center group on drop
      return;
    }
  }, [containerRef, panX, panY, scale, onDropNode, onDropGroup]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasMouseDownForMarquee = useCallback((e: React.MouseEvent) => {
    // Only respond on left click on empty canvas
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (!target.classList.contains('grid-bg') && !target.classList.contains('canvas')) return;
    if (currentTool !== 'select') return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startCanvas = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);

    onMarqueeStart(startCanvas.x, startCanvas.y);

    const onMove = (ev: MouseEvent) => {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const p = screenToCanvas(ev.clientX, ev.clientY, r, panX, panY, scale);
      onMarqueeMove(p.x, p.y);
    };

    const onUp = () => {
      onMarqueeEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [containerRef, panX, panY, scale, currentTool, onMarqueeStart, onMarqueeMove, onMarqueeEnd]);

  return {
    handleMouseDown,
    handleCanvasClick,
    handleContextMenu,
    handleDrop,
    handleDragOver,
    handleCanvasMouseDownForMarquee,
  };
}
