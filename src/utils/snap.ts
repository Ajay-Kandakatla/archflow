import type { DiagramNode, GroupContainer } from '@/types';

const SNAP_THRESHOLD = 8;

export interface SnapResult {
  snapX: number | null; // the x to snap to, or null if no snap
  snapY: number | null; // the y to snap to, or null if no snap
}

/**
 * Given the dragged object's current position and bounds, check alignment with
 * all other nodes and groups and return snap positions.
 *
 * dragX, dragY = current top-left position of dragged object
 * dragW, dragH = width and height of dragged object
 * nodes = all nodes (filter out the dragging one externally)
 * groups = all groups (filter out the dragging one externally)
 * draggingNodeId / draggingGroupId = id to exclude
 */
export function computeSnap(
  dragX: number, dragY: number, dragW: number, dragH: number,
  nodes: DiagramNode[], groups: GroupContainer[],
  draggingNodeId: number | null, draggingGroupId: number | null,
): SnapResult {
  let snapX: number | null = null;
  let snapY: number | null = null;
  let bestDx = SNAP_THRESHOLD;
  let bestDy = SNAP_THRESHOLD;

  const dragCX = dragX + dragW / 2;
  const dragCY = dragY + dragH / 2;
  const dragRight = dragX + dragW;
  const dragBottom = dragY + dragH;

  // Check all nodes
  for (const n of nodes) {
    if (n.id === draggingNodeId) continue;
    const el = document.getElementById('node-' + n.id);
    const w = el?.offsetWidth || 170;
    const h = el?.offsetHeight || 90;
    const cx = n.x + w / 2;
    const cy = n.y + h / 2;

    // X alignment (vertical guides)
    // left-left
    const d1 = Math.abs(n.x - dragX);
    if (d1 < bestDx) { bestDx = d1; snapX = n.x; }
    // right-right
    const d2 = Math.abs((n.x + w) - dragRight);
    if (d2 < bestDx) { bestDx = d2; snapX = n.x + w - dragW; }
    // center-center X
    const d3 = Math.abs(cx - dragCX);
    if (d3 < bestDx) { bestDx = d3; snapX = cx - dragW / 2; }

    // Y alignment (horizontal guides)
    // top-top
    const d4 = Math.abs(n.y - dragY);
    if (d4 < bestDy) { bestDy = d4; snapY = n.y; }
    // bottom-bottom
    const d5 = Math.abs((n.y + h) - dragBottom);
    if (d5 < bestDy) { bestDy = d5; snapY = n.y + h - dragH; }
    // center-center Y
    const d6 = Math.abs(cy - dragCY);
    if (d6 < bestDy) { bestDy = d6; snapY = cy - dragH / 2; }
  }

  // Check all groups
  for (const g of groups) {
    if (g.id === draggingGroupId) continue;

    const d1 = Math.abs(g.x - dragX);
    if (d1 < bestDx) { bestDx = d1; snapX = g.x; }
    const d2 = Math.abs((g.x + g.width) - dragRight);
    if (d2 < bestDx) { bestDx = d2; snapX = g.x + g.width - dragW; }

    const d4 = Math.abs(g.y - dragY);
    if (d4 < bestDy) { bestDy = d4; snapY = g.y; }
    const d5 = Math.abs((g.y + g.height) - dragBottom);
    if (d5 < bestDy) { bestDy = d5; snapY = g.y + g.height - dragH; }
  }

  return { snapX, snapY };
}
