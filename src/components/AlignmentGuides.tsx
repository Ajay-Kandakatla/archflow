import React, { useMemo } from 'react';
import { useDiagramState } from '@/store/DiagramContext';

const SNAP_THRESHOLD = 8; // pixels to trigger guide line

interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
}

interface AlignmentGuidesProps {
  /** ID of the node/group currently being dragged, or null */
  draggingNodeId: number | null;
  draggingGroupId: number | null;
}

export function AlignmentGuides({ draggingNodeId, draggingGroupId }: AlignmentGuidesProps) {
  const state = useDiagramState();

  const guides = useMemo(() => {
    if (draggingNodeId === null && draggingGroupId === null) return [];

    const result: Guide[] = [];

    // Get the dragging object's bounds
    let dragX = 0, dragY = 0, dragW = 170, dragH = 90;

    if (draggingNodeId !== null) {
      const dn = state.nodes.find(n => n.id === draggingNodeId);
      if (!dn) return [];
      dragX = dn.x;
      dragY = dn.y;
      const el = document.getElementById('node-' + dn.id);
      dragW = dn.width || el?.offsetWidth || 170;
      dragH = dn.height || el?.offsetHeight || 90;
    } else if (draggingGroupId !== null) {
      const dg = state.groups.find(g => g.id === draggingGroupId);
      if (!dg) return [];
      dragX = dg.x;
      dragY = dg.y;
      dragW = dg.width;
      dragH = dg.height;
    }

    const dragCX = dragX + dragW / 2;
    const dragCY = dragY + dragH / 2;
    const dragRight = dragX + dragW;
    const dragBottom = dragY + dragH;

    // Check alignment with all other nodes
    state.nodes.forEach(n => {
      if (n.id === draggingNodeId) return;
      const el = document.getElementById('node-' + n.id);
      const w = n.width || el?.offsetWidth || 170;
      const h = n.height || el?.offsetHeight || 90;
      const cx = n.x + w / 2;
      const cy = n.y + h / 2;

      // Vertical guides (x alignment)
      if (Math.abs(n.x - dragX) < SNAP_THRESHOLD) result.push({ type: 'vertical', position: n.x }); // left-left
      if (Math.abs((n.x + w) - dragRight) < SNAP_THRESHOLD) result.push({ type: 'vertical', position: n.x + w }); // right-right
      if (Math.abs(cx - dragCX) < SNAP_THRESHOLD) result.push({ type: 'vertical', position: cx }); // center-center

      // Horizontal guides (y alignment)
      if (Math.abs(n.y - dragY) < SNAP_THRESHOLD) result.push({ type: 'horizontal', position: n.y }); // top-top
      if (Math.abs((n.y + h) - dragBottom) < SNAP_THRESHOLD) result.push({ type: 'horizontal', position: n.y + h }); // bottom-bottom
      if (Math.abs(cy - dragCY) < SNAP_THRESHOLD) result.push({ type: 'horizontal', position: cy }); // center-center
    });

    // Check alignment with groups
    state.groups.forEach(g => {
      if (g.id === draggingGroupId) return;

      if (Math.abs(g.x - dragX) < SNAP_THRESHOLD) result.push({ type: 'vertical', position: g.x });
      if (Math.abs((g.x + g.width) - dragRight) < SNAP_THRESHOLD) result.push({ type: 'vertical', position: g.x + g.width });
      if (Math.abs(g.y - dragY) < SNAP_THRESHOLD) result.push({ type: 'horizontal', position: g.y });
      if (Math.abs((g.y + g.height) - dragBottom) < SNAP_THRESHOLD) result.push({ type: 'horizontal', position: g.y + g.height });
    });

    // Deduplicate by position
    const unique: Guide[] = [];
    const seen = new Set<string>();
    result.forEach(g => {
      const key = `${g.type}-${Math.round(g.position)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(g);
      }
    });

    return unique;
  }, [draggingNodeId, draggingGroupId, state.nodes, state.groups]);

  if (guides.length === 0) return null;

  return (
    <svg
      className="alignment-guides"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      {guides.map((g, i) => (
        g.type === 'vertical' ? (
          <line
            key={`v-${i}`}
            x1={g.position}
            y1={-4000}
            x2={g.position}
            y2={12000}
            stroke="rgba(107,159,219,0.4)"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
        ) : (
          <line
            key={`h-${i}`}
            x1={-4000}
            y1={g.position}
            x2={12000}
            y2={g.position}
            stroke="rgba(107,159,219,0.4)"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
        )
      ))}
    </svg>
  );
}
