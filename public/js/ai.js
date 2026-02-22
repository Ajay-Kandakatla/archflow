import { S } from './state.js';
import { API, authHeaders, authFetch } from './api.js';
import { createNode } from './nodes.js';
import { createConnection } from './connections.js';
import { addStickyNote } from './notes.js';
import { fitToScreen, showToast } from './ui.js';
import { scheduleAutoSave } from './diagram.js';

export function showAIModal() {
    document.getElementById('aiModal').classList.add('visible');
    document.getElementById('aiPromptInput').focus();
}

export function hideAIModal() {
    document.getElementById('aiModal').classList.remove('visible');
}

export function setAIExample(text) {
    document.getElementById('aiPromptInput').value = text;
}

export async function generateDiagram() {
    const input = document.getElementById('aiPromptInput');
    const btn = document.getElementById('aiGenerateBtn');
    const prompt = input.value.trim();
    if (!prompt) { showToast('Please describe your architecture'); return; }

    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
        const resp = await authFetch('/api/ai/generate', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ prompt })
        });
        const data = await resp.json();

        if (data.error) {
            showToast(data.error);
            return;
        }

        // Build the diagram from AI response
        if (data.nodes && data.nodes.length > 0) {
            buildDiagramFromAI(data);
            hideAIModal();
            showToast('Diagram generated!');
        } else {
            showToast('Could not generate diagram. Try a more specific prompt.');
        }
    } catch (e) {
        console.error('AI generate failed:', e);
        showToast('Generation failed. Check API key in settings.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Diagram';
    }
}

function buildDiagramFromAI(data) {
    // data = { nodes: [{type, title, desc, x, y}], connections: [{from, to, fromPort, toPort, label}], notes: [{text, color, x, y}] }
    const idMap = {};

    (data.nodes || []).forEach((n, i) => {
        const node = createNode(n.type || 'server', n.x || (200 + (i % 4) * 250), n.y || (150 + Math.floor(i / 4) * 200));
        if (node) {
            idMap[n.id || i] = node.id;
            if (n.title) {
                node.title = n.title;
                const el = document.getElementById('node-' + node.id);
                if (el) el.querySelector('.node-title').value = n.title;
            }
            if (n.desc) {
                node.desc = n.desc;
                const el = document.getElementById('node-' + node.id);
                if (el) el.querySelector('.node-desc').value = n.desc;
            }
        }
    });

    (data.connections || []).forEach(c => {
        const fromId = idMap[c.from];
        const toId = idMap[c.to];
        if (fromId && toId) {
            createConnection(fromId, c.fromPort || 'right', toId, c.toPort || 'left', c.label || 'data');
        }
    });

    (data.notes || []).forEach(n => {
        addStickyNote(n.color || 'yellow', n.x || 100, n.y || 100);
        const note = S.stickyNotes[S.stickyNotes.length - 1];
        if (note && n.text) {
            note.text = n.text;
            const el = document.getElementById('note-' + note.id);
            if (el) el.querySelector('textarea').value = n.text;
        }
    });

    setTimeout(() => fitToScreen(), 100);
    scheduleAutoSave();
}
