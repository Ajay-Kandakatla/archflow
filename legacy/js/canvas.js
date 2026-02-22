import { S } from './state.js';
import { updateMinimap } from './minimap.js';

export function updateTransform() {
    const canvas = document.getElementById('canvas');
    canvas.style.transform = `translate(${S.panX}px,${S.panY}px) scale(${S.scale})`;
    document.getElementById('zoomLevel').textContent = Math.round(S.scale * 100) + '%';
    updateMinimap();
}

export function zoomIn() { S.scale = Math.min(3, S.scale * 1.15); updateTransform(); }
export function zoomOut() { S.scale = Math.max(0.15, S.scale / 1.15); updateTransform(); }
export function resetZoom() { S.scale = 1; S.panX = 0; S.panY = 0; updateTransform(); }

export function screenToCanvas(sx, sy) {
    const r = document.getElementById('canvasContainer').getBoundingClientRect();
    return { x: (sx - r.left - S.panX) / S.scale, y: (sy - r.top - S.panY) / S.scale };
}
