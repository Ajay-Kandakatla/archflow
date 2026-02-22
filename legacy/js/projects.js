import { S } from './state.js';
import { API } from './api.js';
import { loadDiagram, clearCanvasQuiet, updateDiagramNameDisplay } from './diagram.js';
import { fitToScreen, showToast } from './ui.js';
import { showTemplateModal } from './templates.js';

export function toggleProjectPanel() {
    S.projectPanelOpen = !S.projectPanelOpen;
    document.getElementById('projectPanel').classList.toggle('open', S.projectPanelOpen);
    if (S.projectPanelOpen) refreshProjectList();
}

export async function refreshProjectList() {
    try {
        const diagrams = await API.list();
        const list = document.getElementById('projectList');
        if (diagrams.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px">No diagrams yet.<br>Create one to get started!</div>';
            return;
        }
        list.innerHTML = diagrams.map(d => `
            <div class="project-item ${d._id === S.currentDiagramId ? 'active' : ''}" onclick="switchDiagram('${d._id}')">
                <div>
                    <div class="project-item-name">${d.name || 'Untitled'}</div>
                    <div class="project-item-date">${new Date(d.updatedAt).toLocaleDateString()}</div>
                </div>
                <button class="project-item-del" onclick="event.stopPropagation();deleteDiagram('${d._id}')">&#x2715;</button>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

export async function switchDiagram(id) {
    await loadDiagram(id);
    fitToScreen();
    if (S.projectPanelOpen) toggleProjectPanel();
}

export async function newDiagram() {
    S.currentDiagramId = null;
    clearCanvasQuiet();
    const hintOverlay = document.getElementById('hintOverlay');
    hintOverlay.style.display = 'flex'; hintOverlay.style.opacity = '1';
    updateDiagramNameDisplay('Untitled Diagram');
    history.replaceState(null, '', '/');
    document.getElementById('autosaveIndicator').style.display = 'none';
    if (S.projectPanelOpen) toggleProjectPanel();
    showTemplateModal();
}

export async function deleteDiagram(id) {
    if (!confirm('Delete this diagram permanently?')) return;
    await API.remove(id);
    if (id === S.currentDiagramId) await newDiagram();
    refreshProjectList();
    showToast('Diagram deleted');
}
