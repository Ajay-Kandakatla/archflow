import React, { useCallback, useRef } from 'react';
import type { DiagramNode, PortPosition, NodeColor, TextFormatting } from '@/types';
import { useDiagram } from '@/store/DiagramContext';
import { CV, CV_LIGHT, isShapeType, isWireframeType } from '@/store/constants';
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

/** Return the SVG shape element(s) for a shape type */
function getShapeSVG(type: string): React.ReactNode {
  switch (type) {
    case 'circle':
      return <ellipse cx="50" cy="50" rx="49" ry="49" />;
    case 'diamond':
      return <polygon points="50,1 99,50 50,99 1,50" />;
    case 'hexagon':
      return <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" />;
    case 'pill':
      return <rect x="1" y="1" width="98" height="98" rx="49" ry="49" />;
    case 'cylinder':
      return (
        <>
          <path d="M1,18 C1,8 50,0 50,0 C50,0 99,8 99,18 L99,82 C99,92 50,100 50,100 C50,100 1,92 1,82 Z" />
          <ellipse cx="50" cy="18" rx="49" ry="18" fillOpacity="0" strokeOpacity="0.3" />
        </>
      );
    case 'parallelogram':
      return <polygon points="20,1 99,1 80,99 1,99" />;
    case 'rectangle':
      return <rect x="1" y="1" width="98" height="98" rx="3" ry="3" />;
    case 'rounded-rect':
      return <rect x="1" y="1" width="98" height="98" rx="16" ry="16" />;
    default:
      return <rect x="1" y="1" width="98" height="98" rx="3" ry="3" />;
  }
}

/** Wireframe inner content component */
function WireframeContent({ node, dispatch, theme }: { node: DiagramNode; dispatch: any; theme: string }) {
  switch (node.type) {
    case 'wf-button':
      return (
        <div className="wf-button-inner">
          <input className="wf-label" defaultValue={node.title || 'Button'}
            onChange={(e) => dispatch({ type: 'UPDATE_NODE_TITLE', payload: { id: node.id, title: e.target.value } })} />
        </div>
      );
    case 'wf-input':
      return (
        <div className="wf-input-inner">
          <span className="wf-input-label">{node.title || 'Label'}</span>
          <div className="wf-input-field">
            <span className="wf-input-placeholder">Enter text...</span>
          </div>
        </div>
      );
    case 'wf-text':
      return (
        <div className="wf-text-inner">
          <textarea className="wf-text-area" defaultValue={node.title || 'Text block'}
            onChange={(e) => dispatch({ type: 'UPDATE_NODE_TITLE', payload: { id: node.id, title: e.target.value } })} />
        </div>
      );
    case 'wf-image':
      return (
        <div className="wf-image-inner">
          <svg viewBox="0 0 100 80" className="wf-image-placeholder" preserveAspectRatio="xMidYMid meet">
            <rect x="1" y="1" width="98" height="78" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
            <line x1="1" y1="1" x2="99" y2="79" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <line x1="99" y1="1" x2="1" y2="79" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <text x="50" y="44" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5">Image</text>
          </svg>
        </div>
      );
    case 'wf-browser':
      return (
        <div className="wf-browser-inner">
          <div className="wf-browser-chrome">
            <span className="wf-browser-dots">
              <span className="wf-dot red" /><span className="wf-dot yellow" /><span className="wf-dot green" />
            </span>
            <div className="wf-browser-url">https://</div>
          </div>
          <div className="wf-browser-viewport" />
        </div>
      );
    case 'wf-mobile':
      return (
        <div className="wf-mobile-inner">
          <div className="wf-mobile-notch" />
          <div className="wf-mobile-screen" />
          <div className="wf-mobile-bar" />
        </div>
      );
    case 'wf-card':
      return (
        <div className="wf-card-inner">
          <div className="wf-card-header">
            <input className="wf-card-title" defaultValue={node.title || 'Card Title'}
              onChange={(e) => dispatch({ type: 'UPDATE_NODE_TITLE', payload: { id: node.id, title: e.target.value } })} />
          </div>
          <div className="wf-card-body" />
        </div>
      );
    case 'wf-divider':
      return <div className="wf-divider-inner"><hr className="wf-divider-line" /></div>;
    case 'wf-header':
      return (
        <div className="wf-header-inner">
          <span className="wf-header-logo">Logo</span>
          <div className="wf-header-nav">
            <span>Home</span><span>About</span><span>Contact</span>
          </div>
        </div>
      );
    case 'wf-dropdown':
      return (
        <div className="wf-dropdown-inner">
          <div className="wf-dropdown-selected">
            <input className="wf-dropdown-text" defaultValue={node.title || 'Select...'}
              onChange={(e) => dispatch({ type: 'UPDATE_NODE_TITLE', payload: { id: node.id, title: e.target.value } })} />
            <span className="wf-dropdown-arrow">&#x25BE;</span>
          </div>
        </div>
      );
    default:
      return <div className="wf-default">{node.title}</div>;
  }
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

  const isShape = isShapeType(node.type);
  const isWireframe = isWireframeType(node.type);

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
    const MIN_W = 60;
    const MIN_H = 30;

    // Lock aspect ratio for circle and diamond shapes
    const lockedAspect = (node.type === 'circle' || node.type === 'diamond');

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

      // Enforce 1:1 aspect ratio for circle/diamond
      if (lockedAspect) {
        const maxDim = Math.max(newW, newH);
        newW = maxDim;
        newH = maxDim;
      }

      dispatch({ type: 'RESIZE_NODE', payload: { id: node.id, x: newX, y: newY, width: newW, height: newH } });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [node.id, node.x, node.y, node.width, node.height, node.type, dispatch]);

  const nodeStyle: React.CSSProperties = {
    left: node.x,
    top: node.y,
    ...(node.width ? { width: node.width } : {}),
    ...(node.height ? { height: node.height } : {}),
    ...(zIndex !== undefined ? { zIndex } : {}),
    ...(node.borderStyle === 'dashed' ? { borderStyle: 'dashed' } : {}),
  };

  // Build class name
  const className = [
    'node',
    isSelected ? 'selected' : '',
    isMultiSelected ? 'multi-selected' : '',
    isShape ? 'shape-node' : '',
    isWireframe ? 'wireframe-node' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      id={'node-' + node.id}
      data-color={node.color}
      data-shape={isShape ? node.type : undefined}
      data-wireframe={isWireframe ? node.type : undefined}
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

      {/* === VISUAL CONTENT — differs by category === */}
      {isShape ? (
        <>
          <svg className="shape-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {getShapeSVG(node.type)}
          </svg>
          <div className="shape-content">
            <input className="shape-title" defaultValue={node.title}
              style={formatStyle(node.titleFormat, state.theme)}
              onChange={(e) => dispatch({ type: 'UPDATE_NODE_TITLE', payload: { id: node.id, title: e.target.value } })} />
          </div>
        </>
      ) : isWireframe ? (
        <WireframeContent node={node} dispatch={dispatch} theme={state.theme} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
});
