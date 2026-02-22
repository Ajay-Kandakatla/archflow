import { S } from './state.js';
import { API } from './api.js';
import { renderNode } from './nodes.js';
import { renderAllConnections } from './connections.js';
import { renderStickyNote } from './notes.js';
import { renderCanvasImage } from './images.js';
import { updateMinimap } from './minimap.js';
import { showToast } from './ui.js';

export function getDiagramData() {
    return { nodes: S.nodes, connections: S.connections, stickyNotes: S.stickyNotes, canvasImages: S.canvasImages, nodeIdCounter: S.nodeIdCounter, connectionIdCounter: S.connectionIdCounter, noteIdCounter: S.noteIdCounter, imageIdCounter: S.imageIdCounter };
}

export async function saveDiagram() {
    const data = getDiagramData();
    try {
        if (S.currentDiagramId) {
            await API.update(S.currentDiagramId, { data });
        } else {
            const name = prompt('Diagram name:', 'Untitled Diagram') || 'Untitled Diagram';
            const result = await API.create(name, data);
            S.currentDiagramId = result._id;
            updateDiagramNameDisplay(result.name);
            history.replaceState(null, '', '/?d=' + S.currentDiagramId);
        }
        showAutoSaveStatus('Saved');
        showToast('Saved!');
    } catch (e) { console.error('Save failed:', e); showToast('Save failed!'); }
}

export async function loadDiagram(id) {
    try {
        const result = await API.get(id);
        if (!result || result.error) return false;
        clearCanvasQuiet();
        const d = result.data || {};
        S.currentDiagramId = result._id;
        S.nodeIdCounter = d.nodeIdCounter || 0; S.connectionIdCounter = d.connectionIdCounter || 0;
        S.noteIdCounter = d.noteIdCounter || 0; S.imageIdCounter = d.imageIdCounter || 0;
        (d.nodes || []).forEach(n => { S.nodes.push(n); renderNode(n); });
        (d.stickyNotes || []).forEach(n => { S.stickyNotes.push(n); renderStickyNote(n); });
        (d.canvasImages || []).forEach(img => { S.canvasImages.push(img); renderCanvasImage(img); });
        S.connections = d.connections || [];
        requestAnimationFrame(() => { renderAllConnections(); updateMinimap(); });
        const hintOverlay = document.getElementById('hintOverlay');
        if (S.nodes.length > 0 || S.canvasImages.length > 0) hintOverlay.style.display = 'none';
        updateDiagramNameDisplay(result.name);
        history.replaceState(null, '', '/?d=' + S.currentDiagramId);
        document.getElementById('autosaveIndicator').style.display = 'flex';
        return true;
    } catch (e) { console.error('Load failed:', e); return false; }
}

export function exportPNG() { showToast('Opening print dialog for export...'); window.print(); }

export function clearCanvas() {
    document.getElementById('contextMenu').style.display = 'none';
    if (!confirm('Clear all nodes, connections, notes, and images?')) return;
    clearCanvasQuiet();
    const hintOverlay = document.getElementById('hintOverlay');
    hintOverlay.style.display = 'flex'; hintOverlay.style.opacity = '1';
    if (S.currentDiagramId) API.update(S.currentDiagramId, { data: getDiagramData() });
}

export function clearCanvasQuiet() {
    S.nodes.forEach(n => { const el = document.getElementById('node-' + n.id); if (el) el.remove(); });
    S.stickyNotes.forEach(n => { const el = document.getElementById('note-' + n.id); if (el) el.remove(); });
    S.canvasImages.forEach(i => { const el = document.getElementById('cimg-' + i.id); if (el) el.remove(); });
    S.nodes = []; S.connections = []; S.stickyNotes = []; S.canvasImages = [];
    S.nodeIdCounter = 0; S.connectionIdCounter = 0; S.noteIdCounter = 0; S.imageIdCounter = 0;
    renderAllConnections(); updateMinimap();
}

export function scheduleAutoSave() {
    if (!S.currentDiagramId) return;
    clearTimeout(S.autoSaveTimer);
    showAutoSaveStatus('Saving...', true);
    S.autoSaveTimer = setTimeout(async () => {
        try {
            await API.update(S.currentDiagramId, { data: getDiagramData() });
            showAutoSaveStatus('Saved');
        } catch (e) { showAutoSaveStatus('Save failed'); }
    }, 1500);
}

export function showAutoSaveStatus(text, saving) {
    const ind = document.getElementById('autosaveIndicator');
    const dot = document.getElementById('autosaveDot');
    const txt = document.getElementById('autosaveText');
    ind.style.display = 'flex';
    txt.textContent = text;
    if (saving) dot.classList.add('saving'); else dot.classList.remove('saving');
}

export function updateDiagramNameDisplay(name) {
    document.getElementById('diagramName').textContent = name || 'Untitled Diagram';
}

export async function renameDiagram() {
    if (!S.currentDiagramId) return;
    const current = document.getElementById('diagramName').textContent;
    const newName = prompt('Rename diagram:', current);
    if (newName && newName !== current) {
        await API.update(S.currentDiagramId, { name: newName });
        updateDiagramNameDisplay(newName);
    }
}
