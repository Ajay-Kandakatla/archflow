import { S } from './state.js';
import { screenToCanvas, updateTransform } from './canvas.js';

export function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

export function fitToScreen() {
    document.getElementById('contextMenu').style.display = 'none';
    if (S.nodes.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    S.nodes.forEach(n => { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x + 180); maxY = Math.max(maxY, n.y + 100); });
    const canvasContainer = document.getElementById('canvasContainer');
    const r = canvasContainer.getBoundingClientRect(), cW = maxX - minX + 100, cH = maxY - minY + 100;
    S.scale = Math.min(r.width / cW, r.height / cH, 1.5);
    S.panX = (r.width - cW * S.scale) / 2 - minX * S.scale + 50 * S.scale;
    S.panY = (r.height - cH * S.scale) / 2 - minY * S.scale + 50 * S.scale;
    updateTransform();
}

export function setTool(t) {
    S.currentTool = t;
    document.querySelectorAll('.topbar-center .tool-btn').forEach(b => b.classList.remove('active'));
    const el = document.getElementById(t + 'Tool');
    if (el) el.classList.add('active');
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.style.cursor = t === 'connect' ? 'crosshair' : t === 'note' ? 'cell' : 'default';
}

export function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') !== 'light';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    S.theme = newTheme;
    localStorage.setItem('archflow-theme', newTheme);
    // Update the toggle button icon
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = newTheme === 'light' ? '🌙' : '☀️';
}

export function initTheme() {
    const saved = localStorage.getItem('archflow-theme');
    if (saved === 'light') {
        document.body.setAttribute('data-theme', 'light');
        S.theme = 'light';
    }
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = S.theme === 'light' ? '🌙' : '☀️';
}
