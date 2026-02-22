import { S } from './state.js';
import { CV } from './constants.js';

export function updateMinimap() {
    const mm = document.getElementById('minimap'), vp = document.getElementById('minimapViewport');
    const mmW = 180, mmH = 120, cW = 8000; const scM = mmW / cW;
    mm.querySelectorAll('.minimap-node').forEach(n => n.remove());
    S.nodes.forEach(n => {
        const dot = document.createElement('div');
        dot.className = 'minimap-node';
        dot.style.left = (n.x * scM) + 'px'; dot.style.top = (n.y * scM) + 'px';
        dot.style.width = '4px'; dot.style.height = '3px';
        dot.style.background = CV[n.color] || '#4f8ff7';
        mm.appendChild(dot);
    });
    const canvasContainer = document.getElementById('canvasContainer');
    const cr = canvasContainer.getBoundingClientRect();
    vp.style.left = (-S.panX / S.scale * scM) + 'px'; vp.style.top = (-S.panY / S.scale * scM) + 'px';
    vp.style.width = (cr.width / S.scale * scM) + 'px'; vp.style.height = (cr.height / S.scale * scM) + 'px';
}
