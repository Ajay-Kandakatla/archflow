import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { CV, CV_LIGHT } from '@/store/constants';
import { getPortPosition, screenToCanvas } from '@/utils/canvas';
import type { PortPosition, Connection, Waypoint } from '@/types';

/** Common return type for all path builders */
interface PathResult {
  pathD: string;
  midX: number;
  midY: number;
  segmentMidpoints: { x: number; y: number }[];
}

/**
 * Build a straight-line path between two ports.
 * With waypoints: polyline through all points.
 * Legacy fallback: single bezierOffset bends the line.
 */
function buildStraightPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  waypoints?: Waypoint[],
  bezierOffset?: { dx: number; dy: number },
): PathResult {
  if (waypoints && waypoints.length > 0) {
    const pts = [p1, ...waypoints, p2];
    const segments: string[] = [`M${pts[0].x},${pts[0].y}`];
    const segMids: { x: number; y: number }[] = [];
    for (let i = 1; i < pts.length; i++) {
      segments.push(`L${pts[i].x},${pts[i].y}`);
      segMids.push({ x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 });
    }
    const midIdx = Math.floor(pts.length / 2);
    const midX = pts[midIdx].x;
    const midY = pts[midIdx].y;
    return { pathD: segments.join(' '), midX, midY, segmentMidpoints: segMids };
  }
  // Legacy single-offset fallback
  const baseMidX = (p1.x + p2.x) / 2;
  const baseMidY = (p1.y + p2.y) / 2;
  const midX = baseMidX + (bezierOffset?.dx || 0);
  const midY = baseMidY + (bezierOffset?.dy || 0);
  const segMids = [{ x: baseMidX, y: baseMidY }];
  if (bezierOffset && (Math.abs(bezierOffset.dx) > 2 || Math.abs(bezierOffset.dy) > 2)) {
    const pathD = `M${p1.x},${p1.y} Q${midX},${midY} ${p2.x},${p2.y}`;
    return { pathD, midX, midY, segmentMidpoints: segMids };
  }
  return { pathD: `M${p1.x},${p1.y} L${p2.x},${p2.y}`, midX, midY, segmentMidpoints: segMids };
}

/**
 * Build an orthogonal (right-angle) path between two ports.
 * With waypoints: route through each waypoint with L-shaped segments.
 * Legacy fallback: single midOffset adjusts the bend.
 */
function buildOrthogonalPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromPort: string,
  toPort: string,
  waypoints?: Waypoint[],
  midOffset: number = 0,
): PathResult & { handleAxis: 'x' | 'y' | null } {
  const GAP = 30;

  const exitDir = fromPort === 'top' ? { x: 0, y: -1 } : fromPort === 'bottom' ? { x: 0, y: 1 } : fromPort === 'left' ? { x: -1, y: 0 } : { x: 1, y: 0 };
  const entryDir = toPort === 'top' ? { x: 0, y: -1 } : toPort === 'bottom' ? { x: 0, y: 1 } : toPort === 'left' ? { x: -1, y: 0 } : { x: 1, y: 0 };

  const e1 = { x: p1.x + exitDir.x * GAP, y: p1.y + exitDir.y * GAP };
  const e2 = { x: p2.x + entryDir.x * GAP, y: p2.y + entryDir.y * GAP };

  if (waypoints && waypoints.length > 0) {
    // Route through waypoints with orthogonal segments
    const allPts = [p1, e1, ...waypoints, e2, p2];
    const parts: string[] = [`M${p1.x},${p1.y}`, `L${e1.x},${e1.y}`];
    const segMids: { x: number; y: number }[] = [
      { x: (p1.x + e1.x) / 2, y: (p1.y + e1.y) / 2 },
    ];

    let prev = e1;
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      // L-shaped: go vertical first, then horizontal
      parts.push(`L${prev.x},${wp.y}`);
      parts.push(`L${wp.x},${wp.y}`);
      segMids.push({ x: (prev.x + wp.x) / 2, y: wp.y });
      prev = wp;
    }
    // Connect to entry point
    parts.push(`L${e2.x},${prev.y}`);
    parts.push(`L${e2.x},${e2.y}`);
    parts.push(`L${p2.x},${p2.y}`);
    segMids.push({ x: (prev.x + e2.x) / 2, y: (prev.y + e2.y) / 2 });
    segMids.push({ x: (e2.x + p2.x) / 2, y: (e2.y + p2.y) / 2 });

    const midWp = waypoints[Math.floor(waypoints.length / 2)];
    return { pathD: parts.join(' '), midX: midWp.x, midY: midWp.y, segmentMidpoints: segMids, handleAxis: null };
  }

  // Legacy single-offset fallback
  const isFromVertical = fromPort === 'top' || fromPort === 'bottom';
  const isToVertical = toPort === 'top' || toPort === 'bottom';

  let segments: string;
  let handleX: number;
  let handleY: number;
  let handleAxis: 'x' | 'y' | null = null;

  if (isFromVertical && isToVertical) {
    const midY = (e1.y + e2.y) / 2 + midOffset;
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${e1.x},${midY} L${e2.x},${midY} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = (e1.x + e2.x) / 2;
    handleY = midY;
    handleAxis = 'y';
  } else if (!isFromVertical && !isToVertical) {
    const midX = (e1.x + e2.x) / 2 + midOffset;
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${midX},${e1.y} L${midX},${e2.y} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = midX;
    handleY = (e1.y + e2.y) / 2;
    handleAxis = 'x';
  } else if (isFromVertical && !isToVertical) {
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${e1.x},${e2.y} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = e1.x;
    handleY = e2.y;
    handleAxis = null;
  } else {
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${e2.x},${e1.y} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = e2.x;
    handleY = e1.y;
    handleAxis = null;
  }

  const segMids = [{ x: handleX, y: handleY }];
  return { pathD: segments, midX: handleX, midY: handleY, segmentMidpoints: segMids, handleAxis };
}

/**
 * Build a bezier curve path between two ports.
 * With waypoints: smooth curve through all points using chained cubic beziers.
 * Legacy fallback: single bezierOffset shifts control points.
 */
function buildBezierPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromPort: string,
  toPort: string,
  waypoints?: Waypoint[],
  bezierOffset?: { dx: number; dy: number },
): PathResult {
  if (waypoints && waypoints.length > 0) {
    const pts = [p1, ...waypoints, p2];
    const n = pts.length;

    // Build smooth cubic bezier path through all points using Catmull-Rom-like tangents
    let pathD = `M${pts[0].x},${pts[0].y}`;
    const segMids: { x: number; y: number }[] = [];

    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const pi = pts[i];
      const pi1 = pts[i + 1];
      const p3 = pts[Math.min(n - 1, i + 2)];

      // Tangent at pi: direction from p0 to pi1, scaled
      const tension = 0.3;
      let c1x = pi.x + (pi1.x - p0.x) * tension;
      let c1y = pi.y + (pi1.y - p0.y) * tension;
      // Tangent at pi1: direction from pi to p3, scaled
      let c2x = pi1.x - (p3.x - pi.x) * tension;
      let c2y = pi1.y - (p3.y - pi.y) * tension;

      // For first segment, align c1 with port exit direction
      if (i === 0) {
        const GAP = Math.max(Math.abs(pi1.x - pi.x), Math.abs(pi1.y - pi.y)) * 0.4;
        const clampedGap = Math.max(GAP, 40);
        if (fromPort === 'bottom') { c1x = pi.x; c1y = pi.y + clampedGap; }
        else if (fromPort === 'top') { c1x = pi.x; c1y = pi.y - clampedGap; }
        else if (fromPort === 'right') { c1x = pi.x + clampedGap; c1y = pi.y; }
        else { c1x = pi.x - clampedGap; c1y = pi.y; }
      }
      // For last segment, align c2 with port entry direction
      if (i === n - 2) {
        const GAP = Math.max(Math.abs(pi1.x - pi.x), Math.abs(pi1.y - pi.y)) * 0.4;
        const clampedGap = Math.max(GAP, 40);
        if (toPort === 'top') { c2x = pi1.x; c2y = pi1.y - clampedGap; }
        else if (toPort === 'bottom') { c2x = pi1.x; c2y = pi1.y + clampedGap; }
        else if (toPort === 'left') { c2x = pi1.x - clampedGap; c2y = pi1.y; }
        else { c2x = pi1.x + clampedGap; c2y = pi1.y; }
      }

      pathD += ` C${c1x},${c1y} ${c2x},${c2y} ${pi1.x},${pi1.y}`;
      // Segment midpoint at t=0.5 on cubic bezier
      const t = 0.5;
      const mx = (1-t)**3*pi.x + 3*(1-t)**2*t*c1x + 3*(1-t)*t**2*c2x + t**3*pi1.x;
      const my = (1-t)**3*pi.y + 3*(1-t)**2*t*c1y + 3*(1-t)*t**2*c2y + t**3*pi1.y;
      segMids.push({ x: mx, y: my });
    }

    const midIdx = Math.floor(n / 2);
    return { pathD, midX: pts[midIdx].x, midY: pts[midIdx].y, segmentMidpoints: segMids };
  }

  // Legacy single-offset fallback
  const ddx = Math.abs(p2.x - p1.x) * 0.5;
  const ddy = Math.abs(p2.y - p1.y) * 0.5;
  let c1x: number, c1y: number, c2x: number, c2y: number;

  if (fromPort === 'bottom' || fromPort === 'top') {
    const d = fromPort === 'bottom' ? 1 : -1;
    c1x = p1.x; c1y = p1.y + d * Math.max(ddy, 40);
    if (toPort === 'left' || toPort === 'right') {
      c2x = toPort === 'left' ? p2.x - Math.max(ddx, 40) : p2.x + Math.max(ddx, 40); c2y = p2.y;
    } else {
      const d2 = toPort === 'top' ? -1 : 1; c2x = p2.x; c2y = p2.y + d2 * Math.max(ddy, 40);
    }
  } else {
    const d = fromPort === 'right' ? 1 : -1;
    c1x = p1.x + d * Math.max(ddx, 40); c1y = p1.y;
    if (toPort === 'top' || toPort === 'bottom') {
      c2x = p2.x; c2y = toPort === 'top' ? p2.y - Math.max(ddy, 40) : p2.y + Math.max(ddy, 40);
    } else {
      const d2 = toPort === 'left' ? -1 : 1; c2x = p2.x + d2 * Math.max(ddx, 40); c2y = p2.y;
    }
  }

  if (bezierOffset) {
    c1x += bezierOffset.dx;
    c1y += bezierOffset.dy;
    c2x += bezierOffset.dx;
    c2y += bezierOffset.dy;
  }

  const pathD = `M${p1.x},${p1.y} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;

  const t = 0.5;
  const midX = (1-t)**3*p1.x + 3*(1-t)**2*t*c1x + 3*(1-t)*t**2*c2x + t**3*p2.x;
  const midY = (1-t)**3*p1.y + 3*(1-t)**2*t*c1y + 3*(1-t)*t**2*c2y + t**3*p2.y;

  const segMids = [{ x: midX, y: midY }];
  return { pathD, midX, midY, segmentMidpoints: segMids };
}

/**
 * Inline label editor component for connection labels
 */
function InlineLabelEditor({ connId, currentLabel, x, y, color, onDone }: {
  connId: number; currentLabel: string; x: number; y: number; color: string; onDone: () => void;
}) {
  const { dispatch } = useDiagram();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(currentLabel);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const save = useCallback(() => {
    dispatch({ type: 'UPDATE_CONNECTION_LABEL', payload: { id: connId, label: value } });
    onDone();
  }, [connId, value, dispatch, onDone]);

  return (
    <foreignObject x={x - 70} y={y - 14} width="140" height="28" style={{ overflow: 'visible' }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone(); }}
        style={{
          width: '100%', height: '100%', background: 'var(--bg-card)', border: `1px solid ${color}`,
          borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'center',
          outline: 'none', padding: '2px 6px', fontFamily: 'inherit',
        }}
      />
    </foreignObject>
  );
}

// Helper to find endpoint position for a connection endpoint (node or note)
function getEndpointPosition(
  id: number, type: 'node' | 'note', port: string,
  nodes: { id: number; x: number; y: number; width?: number; height?: number }[],
  notes: { id: number; x: number; y: number; width: number; height: number }[],
): { x: number; y: number } | null {
  if (type === 'note') {
    const note = notes.find(n => n.id === id);
    if (!note) return null;
    const w = note.width || 200;
    const h = note.height || 150;
    return getPortPosition(note, port as any, w, h);
  }
  const node = nodes.find(n => n.id === id);
  if (!node) return null;
  const el = document.getElementById('node-' + node.id);
  const w = node.width || el?.offsetWidth || 170;
  const h = node.height || el?.offsetHeight || 90;
  return getPortPosition(node, port as any, w, h);
}

export function ConnectionsSvg() {
  const { state, dispatch } = useDiagram();
  const { connections, nodes, stickyNotes } = state;
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const dragRef = useRef<{ connId: number; axis: 'x' | 'y'; startMouse: number; startOffset: number } | null>(null);

  // Keep fresh pan/scale in ref so drag closures always use latest values
  const panScaleRef = useRef({ panX: state.panX, panY: state.panY, scale: state.scale });
  panScaleRef.current = { panX: state.panX, panY: state.panY, scale: state.scale };

  // Use ADA-compliant darker colors for light theme
  const colorMap = state.theme === 'light' ? CV_LIGHT : CV;

  // Drag handler for orthogonal waypoint handles
  const handleWaypointMouseDown = useCallback((
    e: React.MouseEvent, connId: number, axis: 'x' | 'y', currentOffset: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startMouse = axis === 'x' ? e.clientX : e.clientY;
    dragRef.current = { connId, axis, startMouse, startOffset: currentOffset };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const currentMouse = dragRef.current.axis === 'x' ? ev.clientX : ev.clientY;
      const delta = (currentMouse - dragRef.current.startMouse) / panScaleRef.current.scale;
      const newOffset = dragRef.current.startOffset + delta;
      dispatch({ type: 'UPDATE_CONNECTION_MIDOFFSET', payload: { id: dragRef.current.connId, midOffset: newOffset } });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dispatch]);

  // Bezier/straight midpoint drag ref
  const bezierDragRef = useRef<{ connId: number; startMouse: { x: number; y: number }; startOffset: { dx: number; dy: number } } | null>(null);

  // Handler for dragging bezier/straight midpoint handles
  const handleMidpointDragStart = useCallback((
    e: React.MouseEvent, connId: number, currentOffset: { dx: number; dy: number }
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const container = document.getElementById('canvasContainer');
    if (!container) return;
    const { panX, panY, scale } = panScaleRef.current;
    const rect = container.getBoundingClientRect();
    const startCanvas = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);

    bezierDragRef.current = { connId, startMouse: startCanvas, startOffset: currentOffset };

    const onMove = (ev: MouseEvent) => {
      if (!bezierDragRef.current) return;
      const { panX, panY, scale } = panScaleRef.current;
      const r = container.getBoundingClientRect();
      const p = screenToCanvas(ev.clientX, ev.clientY, r, panX, panY, scale);
      const dx = bezierDragRef.current.startOffset.dx + (p.x - bezierDragRef.current.startMouse.x);
      const dy = bezierDragRef.current.startOffset.dy + (p.y - bezierDragRef.current.startMouse.y);
      dispatch({ type: 'UPDATE_CONNECTION_BEZIER_OFFSET', payload: { id: bezierDragRef.current.connId, bezierOffset: { dx, dy } } });
    };
    const onUp = () => {
      bezierDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dispatch]);

  // Unified handler for dragging multi-waypoint handles
  const handleWaypointDrag = useCallback((
    e: React.MouseEvent, connId: number, waypointIndex: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const container = document.getElementById('canvasContainer');
    if (!container) return;

    const onMove = (ev: MouseEvent) => {
      const { panX, panY, scale } = panScaleRef.current;
      const r = container.getBoundingClientRect();
      const p = screenToCanvas(ev.clientX, ev.clientY, r, panX, panY, scale);
      dispatch({ type: 'UPDATE_CONNECTION_WAYPOINT', payload: { id: connId, index: waypointIndex, x: p.x, y: p.y } });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dispatch]);

  // Handler for dragging connection labels
  const labelDragRef = useRef<{ connId: number; startMouse: { x: number; y: number }; startOffset: { dx: number; dy: number }; moved: boolean } | null>(null);
  const handleLabelDragStart = useCallback((
    e: React.MouseEvent, connId: number, currentOffset: { dx: number; dy: number }
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const container = document.getElementById('canvasContainer');
    if (!container) return;
    const { panX, panY, scale } = panScaleRef.current;
    const rect = container.getBoundingClientRect();
    const startCanvas = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);

    labelDragRef.current = { connId, startMouse: startCanvas, startOffset: currentOffset, moved: false };

    const onMove = (ev: MouseEvent) => {
      if (!labelDragRef.current) return;
      const { panX, panY, scale } = panScaleRef.current;
      const r = container.getBoundingClientRect();
      const p = screenToCanvas(ev.clientX, ev.clientY, r, panX, panY, scale);
      const dx = labelDragRef.current.startOffset.dx + (p.x - labelDragRef.current.startMouse.x);
      const dy = labelDragRef.current.startOffset.dy + (p.y - labelDragRef.current.startMouse.y);
      const dist = Math.abs(p.x - labelDragRef.current.startMouse.x) + Math.abs(p.y - labelDragRef.current.startMouse.y);
      if (dist > 3) labelDragRef.current.moved = true;
      if (labelDragRef.current.moved) {
        dispatch({ type: 'UPDATE_CONNECTION_LABEL_OFFSET', payload: { id: labelDragRef.current.connId, labelOffset: { dx, dy } } });
      }
    };
    const onUp = () => {
      const wasDrag = labelDragRef.current?.moved;
      const cId = labelDragRef.current?.connId;
      labelDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // If it was a click (no drag), cycle direction
      if (!wasDrag && cId != null) {
        dispatch({ type: 'CYCLE_CONNECTION_DIRECTION', payload: cId });
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dispatch]);

  // Reconnection drag state
  const [reconnectDrag, setReconnectDrag] = useState<{
    connId: number;
    end: 'from' | 'to';
    fixedPos: { x: number; y: number };
    cursorPos: { x: number; y: number };
  } | null>(null);
  const reconnectRef = useRef(reconnectDrag);
  reconnectRef.current = reconnectDrag;

  // Whole connection drag state (drag entire connection to new location)
  const [wholeConnDrag, setWholeConnDrag] = useState<{
    connId: number;
    fromPos: { x: number; y: number };
    toPos: { x: number; y: number };
    cursorPos: { x: number; y: number };
    phase: 'dragging-from' | 'placed-from';
    newFrom?: { id: number; type: 'node' | 'note'; port: PortPosition };
    placedFromPos?: { x: number; y: number };
  } | null>(null);
  const wholeConnRef = useRef(wholeConnDrag);
  wholeConnRef.current = wholeConnDrag;

  // Handler for dragging the whole connection (starts on mousedown on hitbox while selected)
  const handleWholeConnDragStart = useCallback((
    e: React.MouseEvent, conn: Connection, p1: { x: number; y: number }, p2: { x: number; y: number }
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const container = document.getElementById('canvasContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const { panX, panY, scale } = panScaleRef.current;
    const startCanvas = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);

    // Delete the old connection and start a two-phase drag
    dispatch({ type: 'DELETE_CONNECTION', payload: conn.id });

    setWholeConnDrag({
      connId: conn.id,
      fromPos: p1,
      toPos: p2,
      cursorPos: startCanvas,
      phase: 'dragging-from',
    });

    const onMove = (ev: MouseEvent) => {
      const r = container.getBoundingClientRect();
      const { panX: px, panY: py, scale: sc } = panScaleRef.current;
      const p = screenToCanvas(ev.clientX, ev.clientY, r, px, py, sc);
      setWholeConnDrag(prev => prev ? { ...prev, cursorPos: p } : null);
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      // Find source port under cursor
      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      if (target) {
        const portEl = target.closest('.node-port') as HTMLElement;
        if (portEl) {
          const newPort = portEl.dataset.port as PortPosition;
          let newId: number;
          let newType: 'node' | 'note';
          const nodeEl = portEl.closest('.node') as HTMLElement;
          const noteEl = portEl.closest('.sticky-note') as HTMLElement;
          if (nodeEl) {
            newId = parseInt(nodeEl.id.replace('node-', ''));
            newType = 'node';
          } else if (noteEl) {
            newId = parseInt(noteEl.id.replace('note-', ''));
            newType = 'note';
          } else {
            setWholeConnDrag(null);
            return;
          }

          const r = container.getBoundingClientRect();
          const { panX: dpx, panY: dpy, scale: dsc } = panScaleRef.current;
          const droppedPos = screenToCanvas(ev.clientX, ev.clientY, r, dpx, dpy, dsc);

          // Now start phase 2: drag the target end
          setWholeConnDrag(prev => prev ? {
            ...prev,
            phase: 'placed-from',
            newFrom: { id: newId, type: newType, port: newPort },
            placedFromPos: droppedPos,
          } : null);

          // Start second phase mouse tracking
          const onMove2 = (ev2: MouseEvent) => {
            const r2 = container.getBoundingClientRect();
            const { panX: p2px, panY: p2py, scale: p2sc } = panScaleRef.current;
            const p2 = screenToCanvas(ev2.clientX, ev2.clientY, r2, p2px, p2py, p2sc);
            setWholeConnDrag(prev => prev ? { ...prev, cursorPos: p2 } : null);
          };

          const onUp2 = (ev2: MouseEvent) => {
            window.removeEventListener('mousemove', onMove2);
            window.removeEventListener('mouseup', onUp2);

            const target2 = document.elementFromPoint(ev2.clientX, ev2.clientY);
            if (target2) {
              const portEl2 = target2.closest('.node-port') as HTMLElement;
              if (portEl2) {
                const toPort = portEl2.dataset.port as PortPosition;
                let toId: number;
                let toType: 'node' | 'note';
                const nodeEl2 = portEl2.closest('.node') as HTMLElement;
                const noteEl2 = portEl2.closest('.sticky-note') as HTMLElement;
                if (nodeEl2) {
                  toId = parseInt(nodeEl2.id.replace('node-', ''));
                  toType = 'node';
                } else if (noteEl2) {
                  toId = parseInt(noteEl2.id.replace('note-', ''));
                  toType = 'note';
                } else {
                  setWholeConnDrag(null);
                  return;
                }

                const current = wholeConnRef.current;
                if (current?.newFrom) {
                  // Prevent self-connection
                  if (!(current.newFrom.id === toId && current.newFrom.type === toType)) {
                    dispatch({
                      type: 'ADD_CONNECTION',
                      payload: {
                        from: current.newFrom.id,
                        fromType: current.newFrom.type,
                        fromPort: current.newFrom.port,
                        to: toId,
                        toType: toType,
                        toPort: toPort,
                      },
                    });
                  }
                }
              }
            }
            setWholeConnDrag(null);
          };

          window.addEventListener('mousemove', onMove2);
          window.addEventListener('mouseup', onUp2);
          return;
        }
      }
      // No port found, cancel
      setWholeConnDrag(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [dispatch]);

  // Handler for dragging connection endpoints to reconnect
  const handleEndpointDragStart = useCallback((
    e: React.MouseEvent, conn: Connection, end: 'from' | 'to', fixedPos: { x: number; y: number }
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const container = document.getElementById('canvasContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const { panX: sPx, panY: sPy, scale: sSc } = panScaleRef.current;
    const startCanvas = screenToCanvas(e.clientX, e.clientY, rect, sPx, sPy, sSc);

    setReconnectDrag({
      connId: conn.id,
      end,
      fixedPos,
      cursorPos: startCanvas,
    });

    const onMove = (ev: MouseEvent) => {
      const { panX: mPx, panY: mPy, scale: mSc } = panScaleRef.current;
      const r = container.getBoundingClientRect();
      const p = screenToCanvas(ev.clientX, ev.clientY, r, mPx, mPy, mSc);
      setReconnectDrag(prev => prev ? { ...prev, cursorPos: p } : null);
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      // Temporarily hide the SVG layer to find the port beneath
      const svgLayer = document.getElementById('connectionsLayer');
      if (svgLayer) svgLayer.style.pointerEvents = 'none';

      const target = document.elementFromPoint(ev.clientX, ev.clientY);

      if (svgLayer) svgLayer.style.pointerEvents = '';

      if (target) {
        // Check for direct port hit or a node/note body hit (find nearest port)
        let portEl = target.closest('.node-port') as HTMLElement;

        // If we hit the node body but not a port, find the nearest port
        if (!portEl) {
          const nodeBody = target.closest('.node') as HTMLElement || target.closest('.sticky-note') as HTMLElement;
          if (nodeBody) {
            const ports = nodeBody.querySelectorAll('.node-port');
            let bestPort: HTMLElement | null = null;
            let bestDist = Infinity;
            ports.forEach(p => {
              const pr = (p as HTMLElement).getBoundingClientRect();
              const cx = pr.left + pr.width / 2;
              const cy = pr.top + pr.height / 2;
              const d = Math.sqrt((ev.clientX - cx) ** 2 + (ev.clientY - cy) ** 2);
              if (d < bestDist) { bestDist = d; bestPort = p as HTMLElement; }
            });
            if (bestPort && bestDist < 80) portEl = bestPort;
          }
        }

        if (portEl) {
          const newPort = portEl.dataset.port as PortPosition;
          let newId: number;
          let newType: 'node' | 'note';
          const nodeEl = portEl.closest('.node') as HTMLElement;
          const noteEl = portEl.closest('.sticky-note') as HTMLElement;
          if (nodeEl) {
            newId = parseInt(nodeEl.id.replace('node-', ''));
            newType = 'node';
          } else if (noteEl) {
            newId = parseInt(noteEl.id.replace('note-', ''));
            newType = 'note';
          } else {
            setReconnectDrag(null);
            return;
          }

          // Prevent connecting to the same endpoint on the other end
          const current = reconnectRef.current;
          if (current) {
            const c = connections.find(cc => cc.id === current.connId);
            if (c) {
              const otherEnd = current.end === 'from' ? { id: c.to, type: c.toType || 'node' } : { id: c.from, type: c.fromType || 'node' };
              if (newId === otherEnd.id && newType === otherEnd.type) {
                setReconnectDrag(null);
                return;
              }
            }
          }

          dispatch({
            type: 'RECONNECT_CONNECTION',
            payload: { id: conn.id, end, newId, newType, newPort },
          });
        }
      }

      setReconnectDrag(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [connections, dispatch]);

  return (
    <div className={`connections-layer${state.selectedConnectionId != null ? ' conn-selected' : ''}${reconnectDrag ? ' conn-dragging' : ''}`} id="connectionsLayer">
      <svg id="connectionsSvg">
        <defs>
          {Object.entries(colorMap).map(([color, hex]) => (
            <React.Fragment key={color}>
              {/* Forward arrow: clean triangular arrowhead */}
              <marker id={`ah-${color}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0.5 L7,3 L0,5.5" fill="none" stroke={hex} strokeWidth="1" strokeLinejoin="round" />
              </marker>
              {/* Backward arrow */}
              <marker id={`ah-${color}-rev`} markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse" markerUnits="strokeWidth">
                <path d="M0,0.5 L7,3 L0,5.5" fill="none" stroke={hex} strokeWidth="1" strokeLinejoin="round" />
              </marker>
            </React.Fragment>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {connections.map(conn => {
          const fromType = conn.fromType || 'node';
          const toType = conn.toType || 'node';
          const p1 = getEndpointPosition(conn.from, fromType, conn.fromPort, nodes, stickyNotes);
          const p2 = getEndpointPosition(conn.to, toType, conn.toPort, nodes, stickyNotes);
          if (!p1 || !p2) return null;
          const color = colorMap[conn.color] || '#4f8ff7';
          const dir = conn.direction || 'forward';
          const routing = conn.routing || 'bezier';

          // Compute path based on routing mode
          const hasWaypoints = conn.waypoints && conn.waypoints.length > 0;
          let pathD: string;
          let mx: number;
          let my: number;
          let segmentMidpoints: { x: number; y: number }[] = [];
          let orthoHandle: { x: number; y: number; axis: 'x' | 'y' } | null = null;
          let midpointHandle: { x: number; y: number } | null = null; // for legacy bezier/straight

          if (routing === 'straight') {
            const straight = buildStraightPath(p1, p2, conn.waypoints, conn.bezierOffset);
            pathD = straight.pathD;
            mx = straight.midX;
            my = straight.midY;
            segmentMidpoints = straight.segmentMidpoints;
            if (!hasWaypoints) midpointHandle = { x: straight.midX, y: straight.midY };
          } else if (routing === 'orthogonal') {
            const ortho = buildOrthogonalPath(p1, p2, conn.fromPort, conn.toPort, conn.waypoints, conn.midOffset || 0);
            pathD = ortho.pathD;
            mx = ortho.midX;
            my = ortho.midY;
            segmentMidpoints = ortho.segmentMidpoints;
            if (!hasWaypoints && ortho.handleAxis) {
              orthoHandle = { x: ortho.midX, y: ortho.midY, axis: ortho.handleAxis };
            }
          } else {
            const bezier = buildBezierPath(p1, p2, conn.fromPort, conn.toPort, conn.waypoints, conn.bezierOffset);
            pathD = bezier.pathD;
            mx = bezier.midX;
            my = bezier.midY;
            segmentMidpoints = bezier.segmentMidpoints;
            if (!hasWaypoints) midpointHandle = { x: bezier.midX, y: bezier.midY };
          }

          const pathId = 'path-' + conn.id;

          const dirSymbol = dir === 'forward' ? ' \u2192' : dir === 'backward' ? ' \u2190' : dir === 'bidirectional' ? ' \u2194' : '';
          const displayLabel = (conn.label || '') + dirSymbol;
          const labelWidth = displayLabel.length * 8 + 20;
          const lx = mx + (conn.labelOffset?.dx || 0);
          const ly = my + (conn.labelOffset?.dy || 0);

          // Marker props
          const markerEnd = (dir === 'forward' || dir === 'bidirectional') ? `url(#ah-${conn.color})` : undefined;
          const markerStart = (dir === 'backward' || dir === 'bidirectional') ? `url(#ah-${conn.color}-rev)` : undefined;

          // Routing icon: cycle through bezier → orthogonal → straight
          const routingIcon = routing === 'orthogonal' ? '\u231F' : routing === 'straight' ? '\u2571' : '\u223F';
          const isSelected = state.selectedConnectionId === conn.id;

          return (
            <g key={conn.id} className={`conn-group ${isSelected ? 'conn-selected' : ''}`} data-conn-id={conn.id}>
              {/* Glow */}
              <path d={pathD} stroke={color} strokeWidth={isSelected ? 10 : 6} fill="none" opacity={isSelected ? 0.25 : 0.15} filter="url(#glow)" style={{ pointerEvents: 'none' }} />
              {/* Dashed animated */}
              <path d={pathD} stroke={color} strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="6 4"
                style={{ animation: 'flowDash 1s linear infinite', pointerEvents: 'none' }} />
              {/* Invisible thick hitbox for easy clicking — disabled when selected to allow click-through to nodes */}
              <path d={pathD} stroke="transparent" strokeWidth="16" fill="none"
                style={{ pointerEvents: isSelected ? 'none' : 'stroke', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'SELECT_CONNECTION', payload: conn.id });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  // Add waypoint at double-click position
                  const container = document.getElementById('canvasContainer');
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const canvasPos = screenToCanvas(e.clientX, e.clientY, rect, state.panX, state.panY, state.scale);
                  // Find nearest segment to insert into
                  const pts = [p1, ...(conn.waypoints || []), p2];
                  let bestIdx = 0;
                  let bestDist = Infinity;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const ax = pts[i].x, ay = pts[i].y;
                    const bx = pts[i + 1].x, by = pts[i + 1].y;
                    const dx = bx - ax, dy = by - ay;
                    const len2 = dx * dx + dy * dy;
                    const t = len2 > 0 ? Math.max(0, Math.min(1, ((canvasPos.x - ax) * dx + (canvasPos.y - ay) * dy) / len2)) : 0;
                    const px = ax + t * dx, py = ay + t * dy;
                    const dist = Math.sqrt((canvasPos.x - px) ** 2 + (canvasPos.y - py) ** 2);
                    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
                  }
                  dispatch({ type: 'ADD_CONNECTION_WAYPOINT', payload: { id: conn.id, index: bestIdx, x: canvasPos.x, y: canvasPos.y } });
                  dispatch({ type: 'SELECT_CONNECTION', payload: conn.id });
                }} />
              {/* Main path */}
              <path d={pathD} className="connection-path" stroke={color} id={pathId}
                markerEnd={markerEnd} markerStart={markerStart}
                strokeWidth={isSelected ? 3.5 : 2.5}
                style={{ pointerEvents: 'none' }} />
              {/* Animated particles */}
              {[0, 1, 2].map(i => (
                <React.Fragment key={i}>
                  <circle r="8" fill={color} opacity="0.15">
                    <animateMotion dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.8}s`}>
                      <mpath xlinkHref={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                  <circle r="4" fill={color} className="flow-particle" opacity="0.9">
                    <animateMotion dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.8}s`}>
                      <mpath xlinkHref={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                </React.Fragment>
              ))}
              {/* Multi-waypoint drag handles */}
              {hasWaypoints && conn.waypoints!.map((wp, i) => (
                <circle
                  key={`wp-${i}`}
                  className="waypoint-handle"
                  cx={wp.x}
                  cy={wp.y}
                  r="6"
                  fill={color}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                  opacity="0.7"
                  style={{ pointerEvents: 'all', cursor: 'move' }}
                  onMouseDown={(e) => handleWaypointDrag(e, conn.id, i)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'REMOVE_CONNECTION_WAYPOINT', payload: { id: conn.id, index: i } });
                  }}
                />
              ))}
              {/* Add-waypoint ghost handles at segment midpoints (visible when selected) */}
              {isSelected && !hasWaypoints && segmentMidpoints.map((mp, i) => (
                <circle
                  key={`add-${i}`}
                  className="waypoint-add-handle"
                  cx={mp.x}
                  cy={mp.y}
                  r="5"
                  fill={color}
                  opacity="0.3"
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'ADD_CONNECTION_WAYPOINT', payload: { id: conn.id, index: i, x: mp.x, y: mp.y } });
                  }}
                />
              ))}
              {isSelected && hasWaypoints && segmentMidpoints.map((mp, i) => (
                <circle
                  key={`add-${i}`}
                  className="waypoint-add-handle"
                  cx={mp.x}
                  cy={mp.y}
                  r="5"
                  fill={color}
                  opacity="0.3"
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'ADD_CONNECTION_WAYPOINT', payload: { id: conn.id, index: i, x: mp.x, y: mp.y } });
                  }}
                />
              ))}
              {/* Legacy: draggable waypoint handle for orthogonal connections (no waypoints) */}
              {orthoHandle && (
                <circle
                  className="ortho-waypoint-handle"
                  cx={orthoHandle.x}
                  cy={orthoHandle.y}
                  r="6"
                  fill={color}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                  opacity="0.7"
                  style={{
                    pointerEvents: 'all',
                    cursor: orthoHandle.axis === 'x' ? 'ew-resize' : 'ns-resize',
                  }}
                  onMouseDown={(e) => handleWaypointMouseDown(e, conn.id, orthoHandle!.axis, conn.midOffset || 0)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'UPDATE_CONNECTION_MIDOFFSET', payload: { id: conn.id, midOffset: 0 } });
                  }}
                />
              )}
              {/* Legacy: draggable midpoint handle for bezier/straight connections (no waypoints) */}
              {midpointHandle && (
                <circle
                  className="bezier-midpoint-handle"
                  cx={midpointHandle.x}
                  cy={midpointHandle.y}
                  r="6"
                  fill={color}
                  stroke="var(--bg-primary)"
                  strokeWidth="2"
                  opacity="0.7"
                  style={{ pointerEvents: 'all', cursor: 'move' }}
                  onMouseDown={(e) => handleMidpointDragStart(e, conn.id, conn.bezierOffset || { dx: 0, dy: 0 })}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'UPDATE_CONNECTION_BEZIER_OFFSET', payload: { id: conn.id, bezierOffset: { dx: 0, dy: 0 } } });
                  }}
                />
              )}
              {/* Label — inline editing on double-click, draggable */}
              {editingLabel === conn.id ? (
                <InlineLabelEditor
                  connId={conn.id}
                  currentLabel={conn.label || ''}
                  x={lx}
                  y={ly}
                  color={color}
                  onDone={() => setEditingLabel(null)}
                />
              ) : conn.label ? (
                <>
                  <rect className="connection-label-bg" x={lx - labelWidth / 2} y={ly - 12} width={labelWidth} height={24}
                    style={{ pointerEvents: 'all', cursor: 'grab' }}
                    onMouseDown={(e) => handleLabelDragStart(e, conn.id, conn.labelOffset || { dx: 0, dy: 0 })}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(conn.id); }} />
                  <text className="connection-label" x={lx} y={ly + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="13" style={{ pointerEvents: 'all', cursor: 'grab' }}
                    onMouseDown={(e) => handleLabelDragStart(e, conn.id, conn.labelOffset || { dx: 0, dy: 0 })}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(conn.id); }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dispatch({ type: 'CYCLE_CONNECTION_ROUTING', payload: conn.id });
                    }}>
                    {displayLabel}
                  </text>
                </>
              ) : null}
              {/* Routing toggle button (small icon near label) */}
              <text
                className="conn-routing-toggle"
                x={lx + labelWidth / 2 + 10}
                y={ly + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill={color}
                opacity="0.6"
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'CYCLE_CONNECTION_ROUTING', payload: conn.id });
                }}
              >
                {routingIcon}
              </text>
              {/* Draggable endpoint handles (visible when selected) — drag to detach & reconnect */}
              {isSelected && (
                <>
                  {/* Outer glow ring for source */}
                  <circle cx={p1.x} cy={p1.y} r="14" fill="none" stroke={color} strokeWidth="1.5"
                    opacity="0.4" className="conn-endpoint-pulse" style={{ pointerEvents: 'none' }} />
                  <circle
                    className="conn-endpoint-handle"
                    cx={p1.x}
                    cy={p1.y}
                    r="9"
                    fill={color}
                    stroke="var(--bg-primary)"
                    strokeWidth="3"
                    style={{ pointerEvents: 'all', cursor: 'grab' }}
                    onMouseDown={(e) => handleEndpointDragStart(e, conn, 'from', p2)}
                  />
                  {/* Outer glow ring for target */}
                  <circle cx={p2.x} cy={p2.y} r="14" fill="none" stroke={color} strokeWidth="1.5"
                    opacity="0.4" className="conn-endpoint-pulse" style={{ pointerEvents: 'none' }} />
                  <circle
                    className="conn-endpoint-handle"
                    cx={p2.x}
                    cy={p2.y}
                    r="9"
                    fill={color}
                    stroke="var(--bg-primary)"
                    strokeWidth="3"
                    style={{ pointerEvents: 'all', cursor: 'grab' }}
                    onMouseDown={(e) => handleEndpointDragStart(e, conn, 'to', p1)}
                  />
                </>
              )}
            </g>
          );
        })}
        {/* Temporary reconnection line while dragging endpoint */}
        {reconnectDrag && (
          <line
            x1={reconnectDrag.fixedPos.x}
            y1={reconnectDrag.fixedPos.y}
            x2={reconnectDrag.cursorPos.x}
            y2={reconnectDrag.cursorPos.y}
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {/* Temporary line while dragging whole connection */}
        {wholeConnDrag && wholeConnDrag.phase === 'dragging-from' && (
          <line
            x1={wholeConnDrag.cursorPos.x}
            y1={wholeConnDrag.cursorPos.y}
            x2={wholeConnDrag.cursorPos.x}
            y2={wholeConnDrag.cursorPos.y}
            stroke="var(--accent-blue)"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {wholeConnDrag && wholeConnDrag.phase === 'placed-from' && wholeConnDrag.placedFromPos && (
          <line
            x1={wholeConnDrag.placedFromPos.x}
            y1={wholeConnDrag.placedFromPos.y}
            x2={wholeConnDrag.cursorPos.x}
            y2={wholeConnDrag.cursorPos.y}
            stroke="var(--accent-blue)"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
    </div>
  );
}
