import React, { useCallback, useRef } from 'react';
import type { DiagramNode, PortPosition, NodeColor, TextFormatting } from '@/types';
import { useDiagram } from '@/store/DiagramContext';
import { CV, CV_LIGHT } from '@/store/constants';
import { screenToCanvas } from '@/utils/canvas';
import { computeSnap } from '@/utils/snap';
import { NodeIcon } from '@/components/NodeIcon';

/** Build inline style from TextFormatting */
function formatStyle(fmt: TextFormatting | undefined, theme: string): React.CSSProperties {
  if (!fmt) return {};
  const colorMap = theme === 'light' ? CV_LIGHT : CV;
  const deco: string[] = [];
  if (fmt.underline) deco.push('underline');
  if (fmt.strikethrough) deco.push('line-through');
  return {
    fontSize: fmt.fontSize ? `${fmt.fontSize}px` : undefined,
    fontWeight: fmt.bold ? 700 : undefined,
    fontStyle: fmt.italic ? 'italic' : undefined,
    textDecoration: deco.length > 0 ? deco.join(' ') : undefined,
    textAlign: fmt.textAlign || undefined,
    lineHeight: fmt.lineHeight ? `${fmt.lineHeight}` : undefined,
    color: fmt.textColor ? (colorMap[fmt.textColor as NodeColor] || undefined) : undefined,
  };
}

interface NodeProps {
  node: DiagramNode;
  isSelected: boolean;
  isMultiSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPortDragStart: (nodeId: number, port: PortPosition, startPos: { x: number; y: number }, endpointType?: 'node' | 'note') => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMultiDragStart?: (e: React.MouseEvent) => void;
  zIndex?: number;
}

export const NodeComponent = React.memo(function NodeComponent({ node, isSelected, isMultiSelected, containerRef, onPortDragStart, onDragStart, onDragEnd, onMultiDragStart, zIndex }: NodeProps) {
  const { state, dispatch } = useDiagram();
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  // Keep refs to current pan/scale so drag handler always has fresh values
  const panScaleRef = useRef({ panX: state.panX, panY: state.panY, scale: state.scale });
  panScaleRef.current = { panX: state.panX, panY: state.panY, scale: state.scale };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.node-port') || target.closest('.node-delete') || target.closest('.node-resize') || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    if (state.currentTool !== 'select') return;
    e.stopPropagation(); // Prevent canvas from stealing this event

    // Ctrl+Click (or Cmd+Click) = toggle individual selection
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'TOGGLE_SELECT_NODE', payload: node.id });
      return;
    }

    if (isMultiSelected && onMultiDragStart) {
      onMultiDragStart(e);
      return;
    }

    dispatch({ type: 'SELECT_NODE', payload: node.id });

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { panX, panY, scale } = panScaleRef.current;
    const p = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);
    dragRef.current = { dragging: true, offsetX: p.x - node.x, offsetY: p.y - node.y };
    onDragStart?.();

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const { panX: px, panY: py, scale: s } = panScaleRef.current;
      const pp = screenToCanvas(ev.clientX, ev.clientY, r, px, py, s);
      let newX = pp.x - dragRef.current.offsetX;
      let newY = pp.y - dragRef.current.offsetY;

      // Snap to alignment (reads DOM for live positions)
      const el = document.getElementById('node-' + node.id);
      const w = node.width || el?.offsetWidth || 170;
      const h = node.height || el?.offsetHeight || 90;
      const snap = computeSnap(newX, newY, w, h, state.nodes, state.groups, node.id, null);
      if (snap.snapX !== null) newX = snap.snapX;
      if (snap.snapY !== null) newY = snap.snapY;

      dispatch({ type: 'MOVE_NODE', payload: { id: node.id, x: newX, y: newY } });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      onDragEnd?.();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [node.id, node.x, node.y, state.currentTool, state.nodes, state.groups, dispatch, containerRef, onDragStart, onDragEnd, isMultiSelected, onMultiDragStart]);

  const handlePortMouseDown = useCallback((e: React.MouseEvent, port: PortPosition) => {
    e.stopPropagation();
    const el = document.getElementById('node-' + node.id);
    const w = node.width || el?.offsetWidth || 170;
    const h = node.height || el?.offsetHeight || 90;
    let pos = { x: node.x, y: node.y };
    switch (port) {
      case 'top': pos = { x: node.x + w / 2, y: node.y }; break;
      case 'bottom': pos = { x: node.x + w / 2, y: node.y + h }; break;
      case 'left': pos = { x: node.x, y: node.y + h / 2 }; break;
      case 'right': pos = { x: node.x + w, y: node.y + h / 2 }; break;
    }
    onPortDragStart(node.id, port, pos);
  }, [node.id, node.x, node.y, node.width, node.height, onPortDragStart]);

  // Resize handler — supports 8 handles: 4 edges + 4 corners
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = document.getElementById('node-' + node.id);
    const startW = node.width || el?.offsetWidth || 170;
    const startH = node.height || el?.offsetHeight || 90;
    const startX = node.x;
    const startY = node.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const MIN_W = 140;
    const MIN_H = 70;

    const onMove = (ev: MouseEvent) => {
      const { scale } = panScaleRef.current;
      const dx = (ev.clientX - startMouseX) / scale;
      const dy = (ev.clientY - startMouseY) / scale;
      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      // Apply resize based on which handle is being dragged
      if (handle.includes('right')) { newW = Math.max(MIN_W, startW + dx); }
      if (handle.includes('left')) { newW = Math.max(MIN_W, startW - dx); newX = startX + startW - newW; }
      if (handle.includes('bottom')) { newH = Math.max(MIN_H, startH + dy); }
      if (handle.includes('top')) { newH = Math.max(MIN_H, startH - dy); newY = startY + startH - newH; }

      dispatch({ type: 'RESIZE_NODE', payload: { id: node.id, x: newX, y: newY, width: newW, height: newH } });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [node.id, node.x, node.y, node.width, node.height, dispatch]);

  const nodeStyle: React.CSSProperties = {
    left: node.x,
    top: node.y,
    ...(node.width ? { width: node.width } : {}),
    ...(node.height ? { height: node.height } : {}),
    ...(zIndex !== undefined ? { zIndex } : {}),
    ...(node.borderStyle === 'dashed' ? { borderStyle: 'dashed' } : {}),
  };

  return (
    <div
      className={`node ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''}`}
      id={'node-' + node.id}
      data-color={node.color}
      style={nodeStyle}
      onMouseDown={handleMouseDown}
    >
      {(['top', 'bottom', 'left', 'right'] as PortPosition[]).map(port => (
        <div key={port} className={`node-port ${port}`} data-port={port}
          onMouseDown={(e) => handlePortMouseDown(e, port)} />
      ))}
      <button className="node-delete" onClick={() => dispatch({ type: 'DELETE_NODE', payload: node.id })}>✕</button>

      {/* Resize handles — 4 edges + 4 corners */}
      {(isSelected || isMultiSelected) && (
        <>
          <div className="node-resize node-resize-top" onMouseDown={(e) => handleResizeMouseDown(e, 'top')} />
          <div className="node-resize node-resize-bottom" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} />
          <div className="node-resize node-resize-left" onMouseDown={(e) => handleResizeMouseDown(e, 'left')} />
          <div className="node-resize node-resize-right" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} />
          <div className="node-resize node-resize-top-left" onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')} />
          <div className="node-resize node-resize-top-right" onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')} />
          <div className="node-resize node-resize-bottom-left" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')} />
          <div className="node-resize node-resize-bottom-right" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')} />
        </>
      )}

      <div className="node-header">
        <NodeIcon type={node.type} fallback={node.icon} size={22} className="node-icon" />
        <input className="node-title" defaultValue={node.title}
          style={formatStyle(node.titleFormat, state.theme)}
          onChange={(e) => dispatch({ type: 'UPDATE_NODE_TITLE', payload: { id: node.id, title: e.target.value } })} />
      </div>
      <div className="node-body">
        <textarea className="node-desc" defaultValue={node.desc}
          style={formatStyle(node.descFormat, state.theme)}
          onChange={(e) => dispatch({ type: 'UPDATE_NODE_DESC', payload: { id: node.id, desc: e.target.value } })} />
      </div>
    </div>
  );
});
