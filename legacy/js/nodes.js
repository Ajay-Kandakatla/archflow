import { S } from './state.js';
import { CT, CV } from './constants.js';
import { screenToCanvas } from './canvas.js';
import { renderAllConnections } from './connections.js';
import { updateMinimap } from './minimap.js';
import { scheduleAutoSave } from './diagram.js';

export function createNode(type, x, y) {
    const hintOverlay = document.getElementById('hintOverlay');
    hintOverlay.style.opacity = '0'; setTimeout(() => hintOverlay.style.display = 'none', 500);
    const t = CT[type]; if (!t) return;
    const id = ++S.nodeIdCounter;
    const node = { id, type, x, y, ...t };
    S.nodes.push(node); renderNode(node); updateMinimap(); scheduleAutoSave();
    return node;
}

export function renderNode(node) {
    const canvas = document.getElementById('canvas');
    const svg = document.getElementById('connectionsSvg');
    const d = document.createElement('div'); d.className = 'node'; d.id = 'node-' + node.id; d.dataset.color = node.color;
    d.style.left = node.x + 'px'; d.style.top = node.y + 'px';
    d.innerHTML = `<div class="node-port top" data-port="top"></div><div class="node-port bottom" data-port="bottom"></div><div class="node-port left" data-port="left"></div><div class="node-port right" data-port="right"></div><button class="node-delete" onclick="deleteNode(${node.id})">&#x2715;</button><div class="node-header"><span class="node-icon">${node.icon}</span><input class="node-title" value="${node.title}" onchange="updateNodeTitle(${node.id},this.value)"></div><div class="node-body"><textarea class="node-desc" onchange="updateNodeDesc(${node.id},this.value)">${node.desc}</textarea><span class="node-badge">${node.badge}</span></div>`;
    d.addEventListener('mousedown', e => {
        if (e.target.closest('.node-port') || e.target.closest('.node-delete') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (S.currentTool === 'select') { S.isDragging = true; S.dragNode = node; const p = screenToCanvas(e.clientX, e.clientY); S.dragOffsetX = p.x - node.x; S.dragOffsetY = p.y - node.y; selectNode(node.id); }
    });
    d.querySelectorAll('.node-port').forEach(port => {
        port.addEventListener('mousedown', e => {
            e.stopPropagation(); S.connectFrom = node; S.connectFromPort = port.dataset.port;
            const pp = getPortPosition(node, port.dataset.port);
            S.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            S.tempLine.setAttribute('x1', pp.x); S.tempLine.setAttribute('y1', pp.y); S.tempLine.setAttribute('x2', pp.x); S.tempLine.setAttribute('y2', pp.y);
            S.tempLine.setAttribute('stroke', CV[node.color]); S.tempLine.setAttribute('stroke-width', '2.5'); S.tempLine.setAttribute('stroke-dasharray', '6 4');
            svg.appendChild(S.tempLine);
        });
    });
    canvas.appendChild(d);
}

export function updateNodeTitle(id, v) { const n = S.nodes.find(n => n.id === id); if (n) { n.title = v; scheduleAutoSave(); } }
export function updateNodeDesc(id, v) { const n = S.nodes.find(n => n.id === id); if (n) { n.desc = v; scheduleAutoSave(); } }
export function selectNode(id) { deselectAll(); S.selectedNode = id; const el = document.getElementById('node-' + id); if (el) el.classList.add('selected'); }
export function deselectAll() { S.selectedNode = null; document.querySelectorAll('.node.selected').forEach(n => n.classList.remove('selected')); }
export function selectAllNodes() { document.querySelectorAll('.node').forEach(n => n.classList.add('selected')); document.getElementById('contextMenu').style.display = 'none'; }
export function deleteNode(id) { const el = document.getElementById('node-' + id); if (el) el.remove(); S.nodes = S.nodes.filter(n => n.id !== id); S.connections = S.connections.filter(c => c.from !== id && c.to !== id); renderAllConnections(); updateMinimap(); scheduleAutoSave(); }
export function deleteSelected() { if (S.selectedNode) { deleteNode(S.selectedNode); S.selectedNode = null; } }

export function getPortPosition(node, port) {
    const el = document.getElementById('node-' + node.id);
    const w = el ? el.offsetWidth || 170 : 170;
    const h = el ? el.offsetHeight || 90 : 90;
    switch (port) {
        case 'top': return { x: node.x + w / 2, y: node.y };
        case 'bottom': return { x: node.x + w / 2, y: node.y + h };
        case 'left': return { x: node.x, y: node.y + h / 2 };
        case 'right': return { x: node.x + w, y: node.y + h / 2 };
    }
    return { x: node.x, y: node.y };
}
