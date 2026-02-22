import React, { useEffect, useRef } from 'react';
import { useDiagram } from '@/store/DiagramContext';

interface LoginOverlayProps {
  googleClientId: string | null;
  onCredentialResponse: (response: any) => void;
}

export function LoginOverlay({ googleClientId, onCredentialResponse }: LoginOverlayProps) {
  const { state } = useDiagram();
  const btnRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (googleClientId && btnRef.current && !rendered.current && (window as any).google) {
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
      } catch (e) {
        console.error('Google init failed:', e);
      }
    }
  }, [googleClientId, onCredentialResponse]);

  if (state.currentUser) return null;

  return (
    <div className="login-overlay" id="loginOverlay">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="logo-icon">⬡</div>
        <span className="logo">ArchFlow</span>
      </div>
      <div className="login-overlay-box">
        <h2>Welcome to ArchFlow</h2>
        <p>Sign in with Google to start building architecture diagrams</p>
        <div ref={btnRef} id="googleSignInButtonLogin" style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
      </div>
    </div>
  );
}
