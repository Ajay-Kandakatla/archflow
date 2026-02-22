import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { CV, CV_LIGHT } from '@/store/constants';
import { getPortPosition } from '@/utils/canvas';

/**
 * Build a straight-line path between two ports.
 */
function buildStraightPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): string {
  return `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
}

/**
 * Build an orthogonal (right-angle) path between two ports.
 * The path exits the source port perpendicular, makes 90° turns,
 * and enters the target port perpendicularly.
 * midOffset: user-draggable offset from the default midpoint (0 = centered)
 * Returns the path string and the draggable handle position.
 */
function buildOrthogonalPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromPort: string,
  toPort: string,
  midOffset: number = 0,
): { pathD: string; handleX: number; handleY: number; handleAxis: 'x' | 'y' | null } {
  const GAP = 30; // distance to leave the port before turning

  // Exit direction vectors
  const exitDir = fromPort === 'top' ? { x: 0, y: -1 } : fromPort === 'bottom' ? { x: 0, y: 1 } : fromPort === 'left' ? { x: -1, y: 0 } : { x: 1, y: 0 };
  const entryDir = toPort === 'top' ? { x: 0, y: -1 } : toPort === 'bottom' ? { x: 0, y: 1 } : toPort === 'left' ? { x: -1, y: 0 } : { x: 1, y: 0 };

  // First waypoint: exit port
  const e1 = { x: p1.x + exitDir.x * GAP, y: p1.y + exitDir.y * GAP };
  // Last waypoint: approach target port
  const e2 = { x: p2.x + entryDir.x * GAP, y: p2.y + entryDir.y * GAP };

  // Build the middle segments based on axis alignment
  const isFromVertical = fromPort === 'top' || fromPort === 'bottom';
  const isToVertical = toPort === 'top' || toPort === 'bottom';

  let segments: string;
  let handleX: number;
  let handleY: number;
  let handleAxis: 'x' | 'y' | null = null;

  if (isFromVertical && isToVertical) {
    // Both vertical: exit Y, go horizontal, enter Y — drag adjusts midY
    const midY = (e1.y + e2.y) / 2 + midOffset;
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${e1.x},${midY} L${e2.x},${midY} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = (e1.x + e2.x) / 2;
    handleY = midY;
    handleAxis = 'y';
  } else if (!isFromVertical && !isToVertical) {
    // Both horizontal: exit X, go vertical, enter X — drag adjusts midX
    const midX = (e1.x + e2.x) / 2 + midOffset;
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${midX},${e1.y} L${midX},${e2.y} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = midX;
    handleY = (e1.y + e2.y) / 2;
    handleAxis = 'x';
  } else if (isFromVertical && !isToVertical) {
    // From vertical, to horizontal — no adjustable mid segment (L-shape)
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${e1.x},${e2.y} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = e1.x;
    handleY = e2.y;
    handleAxis = null;
  } else {
    // From horizontal, to vertical — no adjustable mid segment (L-shape)
    segments = `M${p1.x},${p1.y} L${e1.x},${e1.y} L${e2.x},${e1.y} L${e2.x},${e2.y} L${p2.x},${p2.y}`;
    handleX = e2.x;
    handleY = e1.y;
    handleAxis = null;
  }

  return { pathD: segments, handleX, handleY, handleAxis };
}

/**
 * Build a bezier curve path between two ports.
 */
function buildBezierPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromPort: string,
  toPort: string,
): { pathD: string; c1x: number; c1y: number; c2x: number; c2y: number } {
  const dx = Math.abs(p2.x - p1.x) * 0.5;
  const dy = Math.abs(p2.y - p1.y) * 0.5;
  let c1x: number, c1y: number, c2x: number, c2y: number;

  if (fromPort === 'bottom' || fromPort === 'top') {
    const d = fromPort === 'bottom' ? 1 : -1;
    c1x = p1.x; c1y = p1.y + d * Math.max(dy, 40);
    if (toPort === 'left' || toPort === 'right') {
      c2x = toPort === 'left' ? p2.x - Math.max(dx, 40) : p2.x + Math.max(dx, 40); c2y = p2.y;
    } else {
      const d2 = toPort === 'top' ? -1 : 1; c2x = p2.x; c2y = p2.y + d2 * Math.max(dy, 40);
    }
  } else {
    const d = fromPort === 'right' ? 1 : -1;
    c1x = p1.x + d * Math.max(dx, 40); c1y = p1.y;
    if (toPort === 'top' || toPort === 'bottom') {
      c2x = p2.x; c2y = toPort === 'top' ? p2.y - Math.max(dy, 40) : p2.y + Math.max(dy, 40);
    } else {
      const d2 = toPort === 'left' ? -1 : 1; c2x = p2.x + d2 * Math.max(dx, 40); c2y = p2.y;
    }
  }

  const pathD = `M${p1.x},${p1.y} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  return { pathD, c1x, c1y, c2x, c2y };
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
  nodes: { id: number; x: number; y: number }[],
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
  return getPortPosition(node, port as any, el?.offsetWidth, el?.offsetHeight);
}

export function ConnectionsSvg() {
  const { state, dispatch } = useDiagram();
  const { connections, nodes, stickyNotes } = state;
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const dragRef = useRef<{ connId: number; axis: 'x' | 'y'; startMouse: number; startOffset: number } | null>(null);

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
      const delta = (currentMouse - dragRef.current.startMouse) / state.scale;
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
  }, [state.scale, dispatch]);

  return (
    <div className="connections-layer" id="connectionsLayer">
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
          let pathD: string;
          let mx: number;
          let my: number;
          let orthoHandle: { x: number; y: number; axis: 'x' | 'y' } | null = null;

          if (routing === 'straight') {
            pathD = buildStraightPath(p1, p2);
            mx = (p1.x + p2.x) / 2;
            my = (p1.y + p2.y) / 2;
          } else if (routing === 'orthogonal') {
            const ortho = buildOrthogonalPath(p1, p2, conn.fromPort, conn.toPort, conn.midOffset || 0);
            pathD = ortho.pathD;
            mx = ortho.handleX;
            my = ortho.handleY;
            if (ortho.handleAxis) {
              orthoHandle = { x: ortho.handleX, y: ortho.handleY, axis: ortho.handleAxis };
            }
          } else {
            const bezier = buildBezierPath(p1, p2, conn.fromPort, conn.toPort);
            pathD = bezier.pathD;
            const t = 0.5;
            mx = (1-t)**3*p1.x + 3*(1-t)**2*t*bezier.c1x + 3*(1-t)*t**2*bezier.c2x + t**3*p2.x;
            my = (1-t)**3*p1.y + 3*(1-t)**2*t*bezier.c1y + 3*(1-t)*t**2*bezier.c2y + t**3*p2.y;
          }

          const pathId = 'path-' + conn.id;

          const dirSymbol = dir === 'forward' ? ' \u2192' : dir === 'backward' ? ' \u2190' : dir === 'bidirectional' ? ' \u2194' : '';
          const displayLabel = (conn.label || '') + dirSymbol;
          const labelWidth = displayLabel.length * 8 + 20;

          // Marker props
          const markerEnd = (dir === 'forward' || dir === 'bidirectional') ? `url(#ah-${conn.color})` : undefined;
          const markerStart = (dir === 'backward' || dir === 'bidirectional') ? `url(#ah-${conn.color}-rev)` : undefined;

          // Routing icon: cycle through bezier → orthogonal → straight
          const routingIcon = routing === 'orthogonal' ? '\u231F' : routing === 'straight' ? '\u2571' : '\u223F';
          const isSelected = state.selectedConnectionId === conn.id;

          return (
            <g key={conn.id} className={`conn-group ${isSelected ? 'conn-selected' : ''}`} data-conn-id={conn.id}>
              {/* Glow */}
              <path d={pathD} stroke={color} strokeWidth={isSelected ? 10 : 6} fill="none" opacity={isSelected ? 0.25 : 0.15} filter="url(#glow)" />
              {/* Dashed animated */}
              <path d={pathD} stroke={color} strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="6 4"
                style={{ animation: 'flowDash 1s linear infinite' }} />
              {/* Invisible thick hitbox for easy clicking */}
              <path d={pathD} stroke="transparent" strokeWidth="16" fill="none"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_CONNECTION', payload: conn.id }); }}
                onDoubleClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_CONNECTION', payload: conn.id }); }} />
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
              {/* Draggable waypoint handle for orthogonal connections */}
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
                    // Reset to default position on double-click
                    dispatch({ type: 'UPDATE_CONNECTION_MIDOFFSET', payload: { id: conn.id, midOffset: 0 } });
                  }}
                />
              )}
              {/* Label — inline editing on double-click */}
              {editingLabel === conn.id ? (
                <InlineLabelEditor
                  connId={conn.id}
                  currentLabel={conn.label || ''}
                  x={mx}
                  y={my}
                  color={color}
                  onDone={() => setEditingLabel(null)}
                />
              ) : conn.label ? (
                <>
                  <rect className="connection-label-bg" x={mx - labelWidth / 2} y={my - 12} width={labelWidth} height={24} />
                  <text className="connection-label" x={mx} y={my + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="13" style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    onClick={() => dispatch({ type: 'CYCLE_CONNECTION_DIRECTION', payload: conn.id })}
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
                x={mx + labelWidth / 2 + 10}
                y={my + 1}
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
            </g>
          );
        })}
      </svg>
    </div>
  );
}
