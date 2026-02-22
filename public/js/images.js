import { S } from './state.js';
import { API } from './api.js';
import { screenToCanvas } from './canvas.js';
import { scheduleAutoSave } from './diagram.js';
import { showToast } from './ui.js';

export function triggerImageUpload() { document.getElementById('imageFileInput').click(); }

export async function handleImageFileSelect(e) {
    const file = e.target.files[0]; if (!file) return;
    await uploadAndPlaceImage(file);
    e.target.value = '';
}

export async function uploadAndPlaceImage(file, x, y) {
    try {
        showToast('Uploading image...');
        const result = await API.uploadImage(file);
        if (result.error) { showToast('Upload failed!'); return; }
        const img = {
            id: ++S.imageIdCounter,
            imageId: result.imageId,
            x: x || 400, y: y || 300,
            width: 300, height: 200,
        };
        S.canvasImages.push(img);
        renderCanvasImage(img);
        scheduleAutoSave();
        showToast('Image added!');
    } catch (e) { console.error(e); showToast('Upload failed!'); }
}

export function renderCanvasImage(img) {
    const canvas = document.getElementById('canvas');
    const d = document.createElement('div');
    d.className = 'canvas-image'; d.id = 'cimg-' + img.id;
    d.style.left = img.x + 'px'; d.style.top = img.y + 'px';
    d.style.width = img.width + 'px'; d.style.height = img.height + 'px';
    d.innerHTML = `<button class="canvas-image-delete" onclick="deleteCanvasImage(${img.id})">&#x2715;</button><img src="${API.imageUrl(img.imageId)}" alt=""><div class="canvas-image-resize"></div>`;

    // Drag
    d.addEventListener('mousedown', e => {
        if (e.target.closest('.canvas-image-delete') || e.target.closest('.canvas-image-resize')) return;
        S.isDragging = true;
        const p = screenToCanvas(e.clientX, e.clientY);
        S.dragNode = img; S.dragOffsetX = p.x - img.x; S.dragOffsetY = p.y - img.y;
        const mv = ev => { const pp = screenToCanvas(ev.clientX, ev.clientY); img.x = pp.x - S.dragOffsetX; img.y = pp.y - S.dragOffsetY; d.style.left = img.x + 'px'; d.style.top = img.y + 'px'; };
        const up = () => { S.isDragging = false; S.dragNode = null; scheduleAutoSave(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });

    // Resize
    const rh = d.querySelector('.canvas-image-resize');
    rh.addEventListener('mousedown', e => {
        e.stopPropagation(); e.preventDefault();
        const startW = img.width, startH = img.height, startX = e.clientX, startY = e.clientY;
        const mv = ev => {
            const dxr = (ev.clientX - startX) / S.scale, dyr = (ev.clientY - startY) / S.scale;
            img.width = Math.max(80, startW + dxr); img.height = Math.max(60, startH + dyr);
            d.style.width = img.width + 'px'; d.style.height = img.height + 'px';
        };
        const up = () => { scheduleAutoSave(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });

    canvas.appendChild(d);
}

export function deleteCanvasImage(id) {
    const el = document.getElementById('cimg-' + id); if (el) el.remove();
    S.canvasImages = S.canvasImages.filter(i => i.id !== id);
    scheduleAutoSave();
}
