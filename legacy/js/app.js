import { S } from './state.js';
import { updateTransform, screenToCanvas, zoomIn, zoomOut, resetZoom } from './canvas.js';
import { initWheelHandler, initTouchHandlers } from './touch.js';
import { createNode, renderNode, selectNode, deselectAll, deleteNode, deleteSelected, updateNodeTitle, updateNodeDesc, selectAllNodes, getPortPosition } from './nodes.js';
import { createConnection, renderAllConnections, updateConnections } from './connections.js';
import { addStickyNote, renderStickyNote, deleteStickyNote, updateNoteText } from './notes.js';
import { triggerImageUpload, handleImageFileSelect, deleteCanvasImage, uploadAndPlaceImage } from './images.js';
import { updateMinimap } from './minimap.js';
import { showTemplateModal, hideTemplateModal, loadTemplate } from './templates.js';
import { fetchGoogleClientId, updateAuthUI, hideLoginOverlay, showLoginOverlay, signOut, toggleUserMenu, showAdminPage, hideAdminPage, startGoogleSignIn, setPostLoginHandler } from './auth.js';
import { toggleProjectPanel, refreshProjectList, switchDiagram, newDiagram, deleteDiagram } from './projects.js';
import { getDiagramData, saveDiagram, loadDiagram, exportPNG, clearCanvas, clearCanvasQuiet, renameDiagram, scheduleAutoSave, updateDiagramNameDisplay } from './diagram.js';
import { showToast, fitToScreen, setTool } from './ui.js';
import { API } from './api.js';

// =============================================
// Expose functions to window for HTML onclick
// =============================================
Object.assign(window, {
    // Topbar
    hideAdminPage, toggleProjectPanel, renameDiagram, setTool,
    triggerImageUpload, zoomOut, zoomIn, resetZoom, showTemplateModal,
    saveDiagram, exportPNG, showAdminPage, signOut, newDiagram,
    startGoogleSignIn,
    // Context menu
    addStickyNote, selectAllNodes, fitToScreen, clearCanvas,
    // Template modal
    hideTemplateModal, loadTemplate,
    // File input
    handleImageFileSelect,
    // Dynamic innerHTML callbacks
    deleteNode, updateNodeTitle, updateNodeDesc,
    deleteStickyNote, updateNoteText,
    deleteCanvasImage, toggleUserMenu,
    switchDiagram, deleteDiagram,
});

// =============================================
// DOM refs
// =============================================
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('canvas');
const svg = document.getElementById('connectionsSvg');
const hintOverlay = document.getElementById('hintOverlay');

// =============================================
// Wheel + Touch (with gesture fix)
// =============================================
initWheelHandler(canvasContainer);
initTouchHandlers(canvasContainer);

// =============================================
// Mouse events: pan, drag, connect
// =============================================
canvasContainer.addEventListener('mousedown', e => {
    if (e.button === 2) return;
    if (S.spacePressed || e.button === 1) {
        S.isPanning = true; S.panStartX = e.clientX - S.panX; S.panStartY = e.clientY - S.panY;
        canvasContainer.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
    if (S.currentTool === 'note' && !e.target.closest('.node') && !e.target.closest('.sticky-note')) {
        const p = screenToCanvas(e.clientX, e.clientY); addStickyNote('yellow', p.x, p.y); return;
    }
    if (!e.target.closest('.node') && !e.target.closest('.sticky-note')) deselectAll();
});

window.addEventListener('mousemove', e => {
    if (S.isPanning) { S.panX = e.clientX - S.panStartX; S.panY = e.clientY - S.panStartY; updateTransform(); return; }
    if (S.isDragging && S.dragNode) {
        const p = screenToCanvas(e.clientX, e.clientY);
        S.dragNode.x = p.x - S.dragOffsetX; S.dragNode.y = p.y - S.dragOffsetY;
        const el = document.getElementById('node-' + S.dragNode.id);
        if (el) { el.style.left = S.dragNode.x + 'px'; el.style.top = S.dragNode.y + 'px'; }
        updateConnections(); updateMinimap();
    }
    if (S.connectFrom && S.tempLine) { const p = screenToCanvas(e.clientX, e.clientY); S.tempLine.setAttribute('x2', p.x); S.tempLine.setAttribute('y2', p.y); }
});

window.addEventListener('mouseup', e => {
    if (S.isPanning) { S.isPanning = false; canvasContainer.style.cursor = S.currentTool === 'connect' ? 'crosshair' : 'default'; }
    if (S.isDragging) { S.isDragging = false; if (S.dragNode) scheduleAutoSave(); S.dragNode = null; }
    if (S.connectFrom && S.tempLine) {
        const t = e.target.closest('.node-port');
        if (t) { const nid = parseInt(t.closest('.node').id.replace('node-', '')); const port = t.dataset.port; if (nid !== S.connectFrom.id) createConnection(S.connectFrom.id, S.connectFromPort, nid, port); }
        if (S.tempLine) { S.tempLine.remove(); S.tempLine = null; } S.connectFrom = null; S.connectFromPort = null;
    }
});

// =============================================
// Context menu
// =============================================
canvasContainer.addEventListener('contextmenu', e => {
    e.preventDefault(); const p = screenToCanvas(e.clientX, e.clientY); S.contextMenuX = p.x; S.contextMenuY = p.y;
    const m = document.getElementById('contextMenu'); m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px'; m.style.display = 'block';
});
document.addEventListener('click', e => { if (!e.target.closest('.context-menu')) document.getElementById('contextMenu').style.display = 'none'; });

// =============================================
// Keyboard shortcuts
// =============================================
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape') { hideTemplateModal(); return; }
    if (e.code === 'Space') { S.spacePressed = true; canvasContainer.style.cursor = 'grab'; e.preventDefault(); }
    if (e.key === 'v' || e.key === 'V') setTool('select');
    if (e.key === 'c' && !e.metaKey && !e.ctrlKey) setTool('connect');
    if (e.key === 'n' || e.key === 'N') setTool('note');
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'i' || e.key === 'I') { triggerImageUpload(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveDiagram(); }
});
document.addEventListener('keyup', e => { if (e.code === 'Space') { S.spacePressed = false; canvasContainer.style.cursor = S.currentTool === 'connect' ? 'crosshair' : 'default'; } });

// =============================================
// Sidebar drag-and-drop
// =============================================
document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', e => { S.dragType = item.dataset.type; e.dataTransfer.effectAllowed = 'copy'; });
});
canvasContainer.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });

// =============================================
// Drop handler: image files + sidebar components
// =============================================
canvasContainer.addEventListener('drop', async e => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            const p = screenToCanvas(e.clientX, e.clientY);
            await uploadAndPlaceImage(file, p.x - 150, p.y - 100);
            return;
        }
    }
    if (S.dragType) { const p = screenToCanvas(e.clientX, e.clientY); createNode(S.dragType, p.x - 85, p.y - 40); S.dragType = null; }
});

// =============================================
// Clipboard paste
// =============================================
document.addEventListener('paste', async e => {
    const items = e.clipboardData?.items; if (!items) return;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile(); if (!file) return;
            const center = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
            await uploadAndPlaceImage(file, center.x - 150, center.y - 100);
            return;
        }
    }
});

// =============================================
// Template modal background click
// =============================================
document.getElementById('templateModal').addEventListener('click', e => { if (e.target === e.currentTarget) hideTemplateModal(); });

// =============================================
// User menu close on outside click
// =============================================
document.addEventListener('click', e => {
    if (!e.target.closest('.user-avatar') && !e.target.closest('.user-menu')) {
        document.getElementById('userMenu').classList.remove('show');
    }
});

// =============================================
// Post-login initialization
// =============================================
async function postLoginInit() {
    // One-time localStorage migration
    const oldData = localStorage.getItem('archflow-data');
    if (oldData && !localStorage.getItem('archflow-migrated')) {
        try {
            const data = JSON.parse(oldData);
            const result = await API.create('Migrated Diagram', data);
            S.currentDiagramId = result._id;
            localStorage.removeItem('archflow-data');
            localStorage.setItem('archflow-migrated', 'true');
            await loadDiagram(result._id);
            showToast('Migrated your diagram to the server!');
            updateTransform();
            return;
        } catch (e) { console.error('Migration failed:', e); }
    }

    // Check URL for diagram ID
    const params = new URLSearchParams(window.location.search);
    const diagramId = params.get('d');

    if (diagramId) {
        const loaded = await loadDiagram(diagramId);
        if (loaded) { fitToScreen(); updateTransform(); return; }
    }

    // Try loading most recent diagram
    try {
        const diagrams = await API.list();
        if (diagrams.length > 0) {
            await loadDiagram(diagrams[0]._id);
            fitToScreen();
            updateTransform();
            return;
        }
    } catch (e) { console.error(e); }

    // No diagrams — show template picker
    showTemplateModal();
    updateTransform();
}

// Register postLoginInit with auth module
setPostLoginHandler(postLoginInit);

// =============================================
// App boot
// =============================================
(async function init() {
    await fetchGoogleClientId();

    try {
        const savedUser = localStorage.getItem('archflow-user');
        const savedToken = localStorage.getItem('archflow-token');
        if (savedUser && savedToken) {
            S.currentUser = JSON.parse(savedUser);
            S.authToken = savedToken;
            updateAuthUI();
            hideLoginOverlay();
            await postLoginInit();
            return;
        }
    } catch (e) {}

    showLoginOverlay();
})();
