import { S } from './state.js';
import { API, authFetch, authHeaders, setAuthExpiredHandler } from './api.js';
import { showToast } from './ui.js';

// postLoginInit will be registered by app.js via setPostLoginHandler
let _postLoginInit = async () => {};
export function setPostLoginHandler(fn) { _postLoginInit = fn; }

export async function fetchGoogleClientId() {
    try {
        const r = await fetch('/api/config');
        const c = await r.json();
        S.googleClientId = c.googleClientId || null;
        if (S.googleClientId && S.googleClientId !== 'your-google-client-id-here') {
            initGoogleIdentity();
        }
    } catch (e) { console.error('Config fetch failed:', e); }
}

export function initGoogleIdentity() {
    if (S.googleInitialized || !S.googleClientId) return;
    try {
        google.accounts.id.initialize({
            client_id: S.googleClientId,
            callback: handleGoogleCredential,
            use_fedcm_for_prompt: false
        });
        S.googleInitialized = true;
        renderGoogleButtons();
    } catch (e) { console.error('Google init failed:', e); }
}

export function renderGoogleButtons() {
    const loginBtn = document.getElementById('googleSignInButtonLogin');
    if (loginBtn) {
        google.accounts.id.renderButton(loginBtn, { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', width: 300 });
    }
    const headerBtn = document.getElementById('googleSignInButtonHeader');
    if (headerBtn && !S.currentUser) {
        google.accounts.id.renderButton(headerBtn, { theme: 'outline', size: 'medium', type: 'icon', shape: 'circle' });
    }
}

export function startGoogleSignIn() {
    if (!S.googleInitialized) { initGoogleIdentity(); }
}

export async function handleGoogleCredential(response) {
    try {
        const result = await API.authGoogle(response.credential);
        if (result.user && result.token) {
            S.currentUser = result.user;
            S.authToken = result.token;
            localStorage.setItem('archflow-user', JSON.stringify(S.currentUser));
            localStorage.setItem('archflow-token', S.authToken);
            updateAuthUI();
            hideLoginOverlay();
            showToast('Signed in as ' + S.currentUser.name);
            await _postLoginInit();
        }
    } catch (e) { console.error('Auth failed:', e); showToast('Sign-in failed'); }
}

export function updateAuthUI() {
    const area = document.getElementById('authArea');
    if (S.currentUser) {
        area.innerHTML = `<img class="user-avatar" src="${S.currentUser.picture || ''}" alt="${S.currentUser.name}" onclick="toggleUserMenu()" referrerpolicy="no-referrer">`;
        document.getElementById('userMenuName').textContent = S.currentUser.name;
        document.getElementById('userMenuEmail').textContent = S.currentUser.email;
    } else {
        area.innerHTML = `<div id="googleSignInButtonHeader"></div>`;
        if (S.googleInitialized) { renderGoogleButtons(); }
    }
    const adminItem = document.getElementById('adminMenuItem');
    if (adminItem) { adminItem.style.display = isAdmin() ? 'block' : 'none'; }
}

export function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('show');
}

export function signOut() {
    S.currentUser = null;
    S.authToken = null;
    localStorage.removeItem('archflow-user');
    localStorage.removeItem('archflow-token');
    document.getElementById('userMenu').classList.remove('show');
    updateAuthUI();
    showLoginOverlay();
    showToast('Signed out');
}

export function showLoginOverlay() { document.getElementById('loginOverlay').classList.remove('hidden'); }
export function hideLoginOverlay() { document.getElementById('loginOverlay').classList.add('hidden'); }

export function isAdmin() {
    return S.currentUser && S.currentUser.email && S.currentUser.email.toLowerCase() === 'ajaykandakatla@gmail.com';
}

export async function showAdminPage() {
    if (!isAdmin()) return;
    document.getElementById('userMenu').classList.remove('show');
    document.getElementById('adminOverlay').classList.add('visible');
    try {
        const [statsResp, usersResp] = await Promise.all([
            authFetch('/api/admin/stats', { headers: authHeaders() }),
            authFetch('/api/admin/users', { headers: authHeaders() })
        ]);
        const stats = await statsResp.json();
        const users = await usersResp.json();
        document.getElementById('adminStats').innerHTML = `
            <div class="admin-stat-card"><div class="admin-stat-number">${stats.totalUsers}</div><div class="admin-stat-label">Total Users</div></div>
            <div class="admin-stat-card"><div class="admin-stat-number">${stats.totalDiagrams}</div><div class="admin-stat-label">Total Diagrams</div></div>`;
        document.getElementById('adminUserList').innerHTML = users.map(u => `
            <tr>
                <td><div class="admin-user-row">
                    <img src="${u.picture || ''}" alt="" referrerpolicy="no-referrer">
                    <div><div class="admin-user-name">${u.name || 'Unknown'}</div><div class="admin-user-email">${u.email || ''}</div></div>
                </div></td>
                <td>${u.diagramCount}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td>${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '-'}</td>
            </tr>`).join('');
    } catch (e) { console.error('Admin fetch failed:', e); }
}

export function hideAdminPage() { document.getElementById('adminOverlay').classList.remove('visible'); }

// Register auth expired handler to break circular dep with api.js
setAuthExpiredHandler(() => { signOut(); showToast('Session expired. Please sign in again.'); });
