import type { DiagramNode, StickyNote, Connection, PortPosition, ConnectionEndpointType } from '@/types';
import { getPortPosition } from './canvas';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SNAP_RADIUS = 40;       // canvas-pixels — snaps to nearest port
export const HIGHLIGHT_RADIUS = 120; // canvas-pixels — highlights nearby ports

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TargetPort {
  id: number;
  type: ConnectionEndpointType;
  port: PortPosition;
  position: { x: number; y: number };
}

export interface SnapResult {
  snapPort: TargetPort | null;         // the port to snap to (within SNAP_RADIUS)
  highlightedKeys: Set<string>;        // port keys within HIGHLIGHT_RADIUS (e.g. "node-5-right")
}

// ─── Utility Functions ────────────────────────────────────────────────────────

/** Build a unique key for a port, used for highlight tracking */
export function portKey(type: ConnectionEndpointType, id: number, port: PortPosition): string {
  return `${type}-${id}-${port}`;
}

/**
 * Get all valid target ports (on nodes and notes), excluding the source endpoint.
 */
export function getValidTargetPorts(
  nodes: DiagramNode[],
  notes: StickyNote[],
  sourceId: number,
  sourceType: ConnectionEndpointType,
): TargetPort[] {
  const ports: TargetPort[] = [];
  const allPorts: PortPosition[] = ['top', 'bottom', 'left', 'right'];

  // Node ports
  for (const node of nodes) {
    if (sourceType === 'node' && node.id === sourceId) continue;

    // Get actual rendered dimensions from DOM, or fall back to defaults
    const el = document.getElementById('node-' + node.id);
    const w = node.width || el?.offsetWidth || 170;
    const h = node.height || el?.offsetHeight || 90;

    for (const port of allPorts) {
      const pos = getPortPosition(node, port, w, h);
      ports.push({ id: node.id, type: 'node', port, position: pos });
    }
  }

  // Sticky note ports
  for (const note of notes) {
    if (sourceType === 'note' && note.id === sourceId) continue;

    const el = document.getElementById('note-' + note.id);
    const w = el?.offsetWidth || note.width || 200;
    const h = el?.offsetHeight || note.height || 150;

    for (const port of allPorts) {
      const pos = getPortPosition(note, port, w, h);
      ports.push({ id: note.id, type: 'note', port, position: pos });
    }
  }

  return ports;
}

/**
 * Find the nearest snap port and all highlighted ports for the given cursor position.
 */
export function findNearestSnapPort(
  cursorX: number,
  cursorY: number,
  validPorts: TargetPort[],
): SnapResult {
  let snapPort: TargetPort | null = null;
  let bestDist = SNAP_RADIUS;
  const highlightedKeys = new Set<string>();

  for (const tp of validPorts) {
    const dx = cursorX - tp.position.x;
    const dy = cursorY - tp.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Highlight radius
    if (dist <= HIGHLIGHT_RADIUS) {
      highlightedKeys.add(portKey(tp.type, tp.id, tp.port));
    }

    // Snap radius — find closest
    if (dist < bestDist) {
      bestDist = dist;
      snapPort = tp;
    }
  }

  // If we have a snap target, make sure it's also highlighted
  if (snapPort) {
    highlightedKeys.add(portKey(snapPort.type, snapPort.id, snapPort.port));
  }

  return { snapPort, highlightedKeys };
}

/**
 * Check if an identical connection already exists (same endpoints & ports, either direction).
 */
export function isDuplicateConnection(
  from: number,
  fromType: ConnectionEndpointType,
  fromPort: PortPosition,
  to: number,
  toType: ConnectionEndpointType,
  toPort: PortPosition,
  connections: Connection[],
): boolean {
  return connections.some(c => {
    const fType = c.fromType || 'node';
    const tType = c.toType || 'node';

    // Same direction
    const sameDir = c.from === from && fType === fromType && c.fromPort === fromPort
                 && c.to === to && tType === toType && c.toPort === toPort;

    // Reverse direction
    const reverseDir = c.from === to && fType === toType && c.fromPort === toPort
                    && c.to === from && tType === fromType && c.toPort === fromPort;

    return sameDir || reverseDir;
  });
}
