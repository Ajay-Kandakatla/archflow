import { S } from './state.js';
import { screenToCanvas } from './canvas.js';
import { scheduleAutoSave } from './diagram.js';

export function addStickyNote(color, x, y) {
    document.getElementById('contextMenu').style.display = 'none';
    if (x === undefined) { x = S.contextMenuX; y = S.contextMenuY; }
    const id = ++S.noteIdCounter;
    const note = { id, x, y, color, text: 'Add your note here...', width: 200, height: 150 };
    S.stickyNotes.push(note); renderStickyNote(note); scheduleAutoSave();
}

export function renderStickyNote(note) {
    const canvas = document.getElementById('canvas');
    const d = document.createElement('div'); d.className = 'sticky-note ' + note.color; d.id = 'note-' + note.id;
    d.style.left = note.x + 'px'; d.style.top = note.y + 'px';
    if (note.width) d.style.width = note.width + 'px';
    if (note.height) d.style.height = note.height + 'px';
    d.innerHTML = `<button class="sticky-delete" onclick="deleteStickyNote(${note.id})">&#x2715;</button><textarea class="sticky-note-text" onchange="updateNoteText(${note.id},this.value)">${note.text}</textarea><div class="sticky-note-resize"></div>`;

    // Drag
    d.addEventListener('mousedown', e => {
        if (e.target.tagName === 'TEXTAREA' || e.target.closest('.sticky-note-resize')) return;
        S.isDragging = true;
        const p = screenToCanvas(e.clientX, e.clientY); S.dragNode = note; S.dragOffsetX = p.x - note.x; S.dragOffsetY = p.y - note.y;
        const mv = ev => { const pp = screenToCanvas(ev.clientX, ev.clientY); note.x = pp.x - S.dragOffsetX; note.y = pp.y - S.dragOffsetY; d.style.left = note.x + 'px'; d.style.top = note.y + 'px'; };
        const up = () => { S.isDragging = false; S.dragNode = null; scheduleAutoSave(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });

    // Resize
    const rh = d.querySelector('.sticky-note-resize');
    rh.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const startW = note.width || 200, startH = note.height || 150;
        const startX = e.clientX, startY = e.clientY;
        const mv = ev => {
            const dxr = (ev.clientX - startX) / S.scale, dyr = (ev.clientY - startY) / S.scale;
            note.width = Math.max(150, startW + dxr); note.height = Math.max(100, startH + dyr);
            d.style.width = note.width + 'px'; d.style.height = note.height + 'px';
        };
        const up = () => { scheduleAutoSave(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });

    canvas.appendChild(d);
}

export function updateNoteText(id, t) { const n = S.stickyNotes.find(n => n.id === id); if (n) { n.text = t; scheduleAutoSave(); } }
export function deleteStickyNote(id) { const el = document.getElementById('note-' + id); if (el) el.remove(); S.stickyNotes = S.stickyNotes.filter(n => n.id !== id); scheduleAutoSave(); }
