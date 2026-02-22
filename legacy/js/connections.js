import { S } from './state.js';
import { CV } from './constants.js';
import { getPortPosition } from './nodes.js';
import { scheduleAutoSave } from './diagram.js';

export function createConnection(fromId, fromPort, toId, toPort, label) {
    const id = ++S.connectionIdCounter; const fn = S.nodes.find(n => n.id === fromId);
    const conn = { id, from: fromId, fromPort, to: toId, toPort, color: fn ? fn.color : 'blue', label: label || 'data', direction: 'forward' };
    S.connections.push(conn); renderAllConnections(); scheduleAutoSave();
}

function cycleDirection(conn) {
    const order = ['forward', 'bidirectional', 'none', 'forward'];
    const idx = order.indexOf(conn.direction || 'forward');
    conn.direction = order[(idx + 1) % (order.length - 1)] || 'forward';
    renderAllConnections(); scheduleAutoSave();
}

export function renderAllConnections() {
    const svg = document.getElementById('connectionsSvg');
    svg.querySelectorAll('.conn-group').forEach(g => g.remove());
    S.connections.forEach(conn => {
        const fn = S.nodes.find(n => n.id === conn.from), tn = S.nodes.find(n => n.id === conn.to); if (!fn || !tn) return;
        const p1 = getPortPosition(fn, conn.fromPort), p2 = getPortPosition(tn, conn.toPort);
        const color = CV[conn.color] || '#4f8ff7';
        const dir = conn.direction || 'forward';
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.classList.add('conn-group'); g.dataset.connId = conn.id;

        const dx = Math.abs(p2.x - p1.x) * 0.5, dy = Math.abs(p2.y - p1.y) * 0.5;
        let c1x, c1y, c2x, c2y;
        if (conn.fromPort === 'bottom' || conn.fromPort === 'top') {
            const d = conn.fromPort === 'bottom' ? 1 : -1; c1x = p1.x; c1y = p1.y + d * Math.max(dy, 40);
            if (conn.toPort === 'left' || conn.toPort === 'right') { c2x = conn.toPort === 'left' ? p2.x - Math.max(dx, 40) : p2.x + Math.max(dx, 40); c2y = p2.y; }
            else { const d2 = conn.toPort === 'top' ? -1 : 1; c2x = p2.x; c2y = p2.y + d2 * Math.max(dy, 40); }
        } else {
            const d = conn.fromPort === 'right' ? 1 : -1; c1x = p1.x + d * Math.max(dx, 40); c1y = p1.y;
            if (conn.toPort === 'top' || conn.toPort === 'bottom') { c2x = p2.x; c2y = conn.toPort === 'top' ? p2.y - Math.max(dy, 40) : p2.y + Math.max(dy, 40); }
            else { const d2 = conn.toPort === 'left' ? -1 : 1; c2x = p2.x + d2 * Math.max(dx, 40); c2y = p2.y; }
        }
        const pathD = `M${p1.x},${p1.y} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;

        // Glow
        const gp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        gp.setAttribute('d', pathD); gp.setAttribute('stroke', color); gp.setAttribute('stroke-width', '6');
        gp.setAttribute('fill', 'none'); gp.setAttribute('opacity', '0.15'); gp.setAttribute('filter', 'url(#glow)'); g.appendChild(gp);

        // Dashed animated
        const dp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        dp.setAttribute('d', pathD); dp.setAttribute('stroke', color); dp.setAttribute('stroke-width', '2');
        dp.setAttribute('fill', 'none'); dp.setAttribute('opacity', '0.3'); dp.setAttribute('stroke-dasharray', '6 4');
        dp.style.animation = 'flowDash 1s linear infinite'; g.appendChild(dp);

        // Main path
        const mp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mp.setAttribute('d', pathD); mp.setAttribute('class', 'connection-path'); mp.setAttribute('stroke', color);
        mp.setAttribute('id', 'path-' + conn.id);

        // Arrow markers based on direction
        if (dir === 'forward') {
            mp.setAttribute('marker-end', `url(#ah-${conn.color})`);
        } else if (dir === 'backward') {
            mp.setAttribute('marker-start', `url(#ah-${conn.color}-rev)`);
        } else if (dir === 'bidirectional') {
            mp.setAttribute('marker-end', `url(#ah-${conn.color})`);
            mp.setAttribute('marker-start', `url(#ah-${conn.color}-rev)`);
        }
        // 'none' = no markers

        mp.style.pointerEvents = 'stroke';
        mp.addEventListener('dblclick', () => { S.connections = S.connections.filter(c => c.id !== conn.id); renderAllConnections(); scheduleAutoSave(); });
        g.appendChild(mp);

        // Animated particles
        for (let i = 0; i < 3; i++) {
            const gc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            gc.setAttribute('r', '8'); gc.setAttribute('fill', color); gc.setAttribute('opacity', '0.15');
            const ga = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            ga.setAttribute('dur', (2.5 + i * 0.3) + 's'); ga.setAttribute('repeatCount', 'indefinite'); ga.setAttribute('begin', (i * 0.8) + 's');
            const gm = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
            gm.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#path-' + conn.id);
            ga.appendChild(gm); gc.appendChild(ga); g.appendChild(gc);

            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('r', '4'); c.setAttribute('fill', color); c.setAttribute('class', 'flow-particle'); c.setAttribute('opacity', '0.9');
            const a = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            a.setAttribute('dur', (2.5 + i * 0.3) + 's'); a.setAttribute('repeatCount', 'indefinite'); a.setAttribute('begin', (i * 0.8) + 's');
            const m = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
            m.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#path-' + conn.id);
            a.appendChild(m); c.appendChild(a); g.appendChild(c);
        }

        // Label (centered on path midpoint, larger font, click to cycle direction)
        if (conn.label) {
            // Use actual bezier midpoint for better centering
            const t = 0.5;
            const mx = Math.pow(1-t,3)*p1.x + 3*Math.pow(1-t,2)*t*c1x + 3*(1-t)*t*t*c2x + Math.pow(t,3)*p2.x;
            const my = Math.pow(1-t,3)*p1.y + 3*Math.pow(1-t,2)*t*c1y + 3*(1-t)*t*t*c2y + Math.pow(t,3)*p2.y;

            // Direction indicator
            const dirSymbol = dir === 'forward' ? ' →' : dir === 'backward' ? ' ←' : dir === 'bidirectional' ? ' ↔' : '';
            const displayLabel = conn.label + dirSymbol;
            const tl = displayLabel.length * 8 + 20;

            const lb = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            lb.setAttribute('class', 'connection-label-bg'); lb.setAttribute('x', mx - tl / 2); lb.setAttribute('y', my - 12); lb.setAttribute('width', tl); lb.setAttribute('height', 24);
            const lt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            lt.setAttribute('class', 'connection-label'); lt.setAttribute('x', mx); lt.setAttribute('y', my + 1); lt.setAttribute('text-anchor', 'middle'); lt.setAttribute('dominant-baseline', 'middle');
            lt.setAttribute('font-size', '13');
            lt.textContent = displayLabel;
            lt.addEventListener('click', (e) => {
                if (e.shiftKey) {
                    // Shift+click to rename
                    const nl = prompt('Connection label:', conn.label);
                    if (nl !== null) { conn.label = nl; renderAllConnections(); scheduleAutoSave(); }
                } else {
                    // Click to cycle direction
                    cycleDirection(conn);
                }
            });
            g.appendChild(lb); g.appendChild(lt);
        }
        svg.appendChild(g);
    });
}

export function updateConnections() { renderAllConnections(); }
