import React, { useEffect, useRef, useState } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { API, setAuthToken } from '@/utils/api';
import { showToast } from '@/components/Toast';

interface LoginOverlayProps {
  googleClientId: string | null;
  onCredentialResponse: (response: any) => void;
  devLoginEnabled?: boolean;
}

export function LoginOverlay({ googleClientId, onCredentialResponse, devLoginEnabled }: LoginOverlayProps) {
  const { state, dispatch } = useDiagram();
  const btnRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [devName, setDevName] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  useEffect(() => {
    if (!googleClientId || !btnRef.current || rendered.current) return;

    const tryRender = () => {
      if (rendered.current || !btnRef.current) return true;
      if (!(window as any).google?.accounts?.id) return false;
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: onCredentialResponse,
          use_fedcm_for_prompt: false,
        });
        (window as any).google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', width: 300,
        });
        rendered.current = true;
        return true;
      } catch (e) {
        console.error('Google init failed:', e);
        return false;
      }
    };

    // Google GSI script loads async — retry until it's available (up to 5s)
    if (!tryRender()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryRender() || attempts >= 10) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [googleClientId, onCredentialResponse]);

  if (state.currentUser) return null;

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim() || !devEmail.trim()) return;
    setDevLoading(true);
    try {
      const result = await API.devLogin(devName.trim(), devEmail.trim());
      setAuthToken(result.token);
      localStorage.setItem('archflow-user', JSON.stringify(result.user));
      localStorage.setItem('archflow-token', result.token);
      dispatch({ type: 'SET_USER', payload: { user: result.user, token: result.token } });
      showToast('Signed in as ' + result.user.name);
    } catch (e) {
      showToast('Sign in failed');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="login-overlay" id="loginOverlay">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="13" r="2.5" fill="white"/>
            <line x1="16" y1="15.5" x2="16" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="18" x2="16" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="20" y1="18" x2="16" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="logo">ArchFlow</span>
      </div>
      <div className="login-overlay-box">
        <h2>Welcome to ArchFlow</h2>
        <p>Sign in to start building architecture diagrams</p>
        <div ref={btnRef} id="googleSignInButtonLogin" style={{ display: 'flex', justifyContent: 'center', minHeight: googleClientId ? 44 : 0 }} />

        {devLoginEnabled && (
          <form onSubmit={handleDevLogin} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300, margin: '16px auto 0' }}>
            {googleClientId && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, margin: '4px 0' }}>or</div>
            )}
            <input
              type="text"
              placeholder="Your name"
              value={devName}
              onChange={e => setDevName(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #334155',
                background: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none',
              }}
            />
            <input
              type="email"
              placeholder="Your email"
              value={devEmail}
              onChange={e => setDevEmail(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #334155',
                background: '#1e293b', color: '#f1f5f9', fontSize: 14, outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={devLoading || !devName.trim() || !devEmail.trim()}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #6b9fdb, #9b8acc)', color: 'white',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: devLoading ? 0.6 : 1,
              }}
            >
              {devLoading ? 'Signing in...' : 'Sign in (Dev Mode)'}
            </button>
          </form>
        )}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <a href="/docs" style={{
            color: '#6b9fdb', fontSize: 13, textDecoration: 'none', opacity: 0.8,
          }}>
            View Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
