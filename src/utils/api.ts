import type { DiagramData, DiagramMeta, User } from '@/types';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function authHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (authToken) h['Authorization'] = 'Bearer ' + authToken;
  return h;
}

async function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const r = await fetch(url, opts);
  if (r.status === 401) {
    // Clear auth state
    localStorage.removeItem('archflow-user');
    localStorage.removeItem('archflow-token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  return r;
}

async function throwIfNotOk(r: Response) {
  if (r.ok) return;
  let message = `Request failed (${r.status})`;
  try {
    const data = await r.json();
    if (data?.error) message = data.error;
  } catch {
    // ignore parse errors
  }
  const err: any = new Error(message);
  err.status = r.status;
  throw err;
}

export const API = {
  async list(): Promise<DiagramMeta[]> {
    const r = await authFetch('/api/diagrams', { headers: authHeaders() });
    await throwIfNotOk(r);
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  },

  async get(id: string): Promise<DiagramMeta> {
    if (!id || id === 'undefined' || id === 'null') throw new Error('Invalid diagram ID');
    const r = await authFetch('/api/diagrams/' + id, { headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },

  async create(name: string, data: Partial<DiagramData>, folder?: string): Promise<DiagramMeta> {
    const r = await authFetch('/api/diagrams', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, data, folder: folder || '' }),
    });
    await throwIfNotOk(r);
    return r.json();
  },

  async update(id: string, payload: { name?: string; data?: DiagramData; folder?: string }): Promise<DiagramMeta> {
    if (!id || id === 'undefined' || id === 'null') throw new Error('Invalid diagram ID');
    const r = await authFetch('/api/diagrams/' + id, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    await throwIfNotOk(r);
    return r.json();
  },

  async remove(id: string): Promise<{ ok: boolean }> {
    const r = await authFetch('/api/diagrams/' + id, { method: 'DELETE', headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },

  async uploadImage(file: File): Promise<{ imageId: string; filename: string; size: number } | { error: string }> {
    const fd = new FormData();
    fd.append('image', file);
    const r = await authFetch('/api/images', {
      method: 'POST',
      headers: authToken ? { Authorization: 'Bearer ' + authToken } : {},
      body: fd,
    });
    await throwIfNotOk(r);
    return r.json();
  },

  imageUrl(id: string): string {
    return '/api/images/' + id;
  },

  async authGoogle(credential: string): Promise<{ user: User; token: string }> {
    const r = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    return r.json();
  },

  async devLogin(name: string, email: string): Promise<{ user: User; token: string }> {
    const r = await fetch('/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    return r.json();
  },

  async getConfig(): Promise<{ googleClientId: string; devLoginEnabled?: boolean }> {
    const r = await fetch('/api/config');
    return r.json();
  },

  async generateDiagram(prompt: string, diagramType?: string): Promise<any> {
    const r = await authFetch('/api/ai/generate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ prompt, diagramType }),
    });
    await throwIfNotOk(r);
    return r.json();
  },

  async getAdminNotifications(since?: string): Promise<{
    newSignupCount: number;
    notifications: Array<{
      type: 'new_signup' | 'returning_login';
      user: { name: string; email: string; picture: string | null };
      time: string;
      message: string;
    }>;
  }> {
    const url = since ? `/api/admin/notifications?since=${encodeURIComponent(since)}` : '/api/admin/notifications';
    const r = await authFetch(url, { headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },

  async getAdminUsers(): Promise<any[]> {
    const r = await authFetch('/api/admin/users', { headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },

  async getAdminStats(): Promise<{ totalUsers: number; totalDiagrams: number }> {
    const r = await authFetch('/api/admin/stats', { headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },

  // Sharing APIs
  async getSharing(diagramId: string): Promise<{ isPublic: boolean; publicRole: string; shareToken: string | null; shares: Array<{ email: string; role: string; addedAt?: string }> }> {
    const r = await authFetch(`/api/diagrams/${diagramId}/sharing`, { headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },

  async updateSharing(diagramId: string, payload: any): Promise<{ shareToken: string }> {
    const r = await authFetch(`/api/diagrams/${diagramId}/sharing`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    await throwIfNotOk(r);
    return r.json();
  },

  async getShared(shareToken: string): Promise<DiagramMeta & { role: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
    const r = await fetch('/api/shared/' + shareToken, { headers });
    if (!r.ok) {
      const err = new Error(r.status === 403 ? 'Access denied' : 'Not found');
      (err as any).status = r.status;
      throw err;
    }
    return r.json();
  },

  async getSharedWithMe(): Promise<DiagramMeta[]> {
    const r = await authFetch('/api/diagrams/shared-with-me', { headers: authHeaders() });
    await throwIfNotOk(r);
    return r.json();
  },
};
