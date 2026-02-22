import { S } from './state.js';

let _onAuthExpired = () => {};
export function setAuthExpiredHandler(fn) { _onAuthExpired = fn; }

export function authHeaders(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    if (S.authToken) h['Authorization'] = 'Bearer ' + S.authToken;
    return h;
}

export async function authFetch(url, opts = {}) {
    const r = await fetch(url, opts);
    if (r.status === 401) { _onAuthExpired(); throw new Error('Unauthorized'); }
    return r;
}

export const API = {
    async list() {
        const r = await authFetch('/api/diagrams', { headers: authHeaders() }); return r.json();
    },
    async get(id) { const r = await authFetch('/api/diagrams/' + id, { headers: authHeaders() }); return r.json(); },
    async create(name, data) {
        const r = await authFetch('/api/diagrams', { method: 'POST', headers: authHeaders(),
            body: JSON.stringify({ name, data }) }); return r.json();
    },
    async update(id, payload) {
        const r = await authFetch('/api/diagrams/' + id, { method: 'PUT', headers: authHeaders(),
            body: JSON.stringify(payload) }); return r.json();
    },
    async remove(id) { const r = await authFetch('/api/diagrams/' + id, { method: 'DELETE', headers: authHeaders() }); return r.json(); },
    async uploadImage(file) {
        const fd = new FormData(); fd.append('image', file);
        const r = await authFetch('/api/images', { method: 'POST', headers: S.authToken ? { 'Authorization': 'Bearer ' + S.authToken } : {}, body: fd }); return r.json();
    },
    imageUrl(id) { return '/api/images/' + id; },
    async authGoogle(credential) {
        const r = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }) }); return r.json();
    }
};
