import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { API } from '@/utils/api';
import { showToast } from '@/components/Toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ShareModalProps {
  diagramName: string;
  onClose: () => void;
  onSave?: () => Promise<void>;
}

interface ShareEntry {
  email: string;
  role: 'viewer' | 'editor';
  addedAt?: string;
}

interface ShareSettings {
  isPublic: boolean;
  publicRole: 'viewer' | 'editor';
  shareToken: string | null;
  shares: ShareEntry[];
}

/** Compute bounding box of all diagram elements */
function computeBounds(
  nodes: { x: number; y: number; width?: number; height?: number; id?: number }[],
  notes: { x: number; y: number; width: number; height: number }[],
  groups: { x: number; y: number; width: number; height: number }[],
  images: { x: number; y: number; width: number; height: number }[],
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  nodes.forEach(n => {
    const el = document.getElementById('node-' + (n as any).id);
    const w = n.width || el?.offsetWidth || 170;
    const h = n.height || el?.offsetHeight || 90;
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + w);
    maxY = Math.max(maxY, n.y + h);
  });

  [...notes, ...groups, ...images].forEach(item => {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + (item.width || 200));
    maxY = Math.max(maxY, item.y + (item.height || 150));
  });

  if (minX === Infinity) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function ShareModal({ diagramName, onClose, onSave }: ShareModalProps) {
  const { state } = useDiagram();
  const [activeTab, setActiveTab] = useState<'share' | 'export'>('share');
  const [exporting, setExporting] = useState(false);

  // Share state
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    publicRole: 'viewer',
    shareToken: null,
    shares: [],
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(true);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Load current sharing settings
  useEffect(() => {
    if (!state.currentDiagramId) { setLoading(false); return; }
    API.getSharing(state.currentDiagramId)
      .then(settings => { setShareSettings(settings); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state.currentDiagramId]);

  // Copy share link
  const handleCopyLink = useCallback(async () => {
    if (!state.currentDiagramId) return;
    let token = shareSettings.shareToken;
    if (!token) {
      // Generate share token
      try {
        const result = await API.updateSharing(state.currentDiagramId, {
          ...shareSettings,
          isPublic: true,
          publicRole: shareSettings.publicRole || 'viewer',
        });
        token = result.shareToken;
        setShareSettings(prev => ({ ...prev, shareToken: token!, isPublic: true }));
      } catch { showToast('Failed to generate link'); return; }
    }
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied!');
  }, [state.currentDiagramId, shareSettings]);

  // Update public access
  const handlePublicAccessChange = useCallback(async (value: string) => {
    if (!state.currentDiagramId) return;
    const isPublic = value !== 'none';
    const publicRole = value === 'editor' ? 'editor' : 'viewer';
    try {
      const result = await API.updateSharing(state.currentDiagramId, {
        ...shareSettings,
        isPublic,
        publicRole,
      });
      setShareSettings(prev => ({ ...prev, isPublic, publicRole, shareToken: result.shareToken }));
    } catch { showToast('Failed to update'); }
  }, [state.currentDiagramId, shareSettings]);

  // Invite user
  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim() || !state.currentDiagramId) return;
    const email = inviteEmail.trim().toLowerCase();
    if (shareSettings.shares.some(s => s.email === email)) {
      showToast('Already shared with this email');
      return;
    }
    const newShares = [...shareSettings.shares, { email, role: inviteRole, addedAt: new Date().toISOString() }];
    try {
      await API.updateSharing(state.currentDiagramId, { ...shareSettings, shares: newShares });
      setShareSettings(prev => ({ ...prev, shares: newShares }));
      setInviteEmail('');
      showToast(`Invited ${email} as ${inviteRole}`);
    } catch { showToast('Failed to invite'); }
  }, [inviteEmail, inviteRole, state.currentDiagramId, shareSettings]);

  // Remove share
  const handleRemoveShare = useCallback(async (email: string) => {
    if (!state.currentDiagramId) return;
    const newShares = shareSettings.shares.filter(s => s.email !== email);
    try {
      await API.updateSharing(state.currentDiagramId, { ...shareSettings, shares: newShares });
      setShareSettings(prev => ({ ...prev, shares: newShares }));
      showToast(`Removed ${email}`);
    } catch { showToast('Failed to remove'); }
  }, [state.currentDiagramId, shareSettings]);

  // Update share role
  const handleUpdateShareRole = useCallback(async (email: string, role: 'viewer' | 'editor') => {
    if (!state.currentDiagramId) return;
    const newShares = shareSettings.shares.map(s => s.email === email ? { ...s, role } : s);
    try {
      await API.updateSharing(state.currentDiagramId, { ...shareSettings, shares: newShares });
      setShareSettings(prev => ({ ...prev, shares: newShares }));
    } catch { showToast('Failed to update role'); }
  }, [state.currentDiagramId, shareSettings]);

  // Export as PNG or PDF
  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    setExporting(true);

    try {
      // Add export-mode class to hide UI elements
      canvas.classList.add('export-mode');

      // Compute bounding box
      const bounds = computeBounds(state.nodes, state.stickyNotes, state.groups, state.canvasImages);
      const padding = 60;

      // Capture with html2canvas
      const captured = await html2canvas(canvas, {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2,
        scale: 2,
        backgroundColor: state.theme === 'dark' ? '#0f1117' : '#f8f9fb',
        useCORS: true,
        logging: false,
      });

      canvas.classList.remove('export-mode');

      if (format === 'png') {
        captured.toBlob((blob) => {
          if (!blob) { showToast('Export failed'); return; }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${diagramName}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          showToast('PNG exported!');
        }, 'image/png');
      } else {
        const imgData = captured.toDataURL('image/png');
        const imgW = captured.width;
        const imgH = captured.height;
        const orientation = imgW > imgH ? 'l' : 'p';
        const pdf = new jsPDF({ orientation, unit: 'px', format: [imgW / 2 + 40, imgH / 2 + 40] });
        pdf.addImage(imgData, 'PNG', 20, 20, imgW / 2, imgH / 2);
        pdf.save(`${diagramName}.pdf`);
        showToast('PDF exported!');
      }
    } catch (e) {
      console.error('Export error:', e);
      // Make sure to remove export-mode even on error
      canvas.classList.remove('export-mode');
      showToast('Export failed');
    }
    setExporting(false);
  }, [state, diagramName]);

  const shareUrl = shareSettings.shareToken
    ? `${window.location.origin}/s/${shareSettings.shareToken}`
    : '';

  const publicAccessValue = !shareSettings.isPublic ? 'none'
    : shareSettings.publicRole === 'editor' ? 'editor' : 'viewer';

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        {/* Tabs */}
        <div className="share-modal-tabs">
          <button
            className={`share-tab ${activeTab === 'share' ? 'active' : ''}`}
            onClick={() => setActiveTab('share')}
          >
            Share
          </button>
          <button
            className={`share-tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button className="share-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="share-tab-content">
            {!state.currentDiagramId ? (
              <div className="share-empty">
                <p>Save the diagram first to enable sharing.</p>
                {onSave && (
                  <button className="share-save-btn" onClick={async () => { await onSave(); }}>
                    Save Now
                  </button>
                )}
              </div>
            ) : loading ? (
              <p className="share-empty">Loading...</p>
            ) : (
              <>
                {/* Copy Link Button */}
                <button className="share-copy-link-btn" onClick={handleCopyLink}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 10.5a4 4 0 005.5 0l2-2a4 4 0 00-5.5-5.5l-1 1" />
                    <path d="M10.5 7.5a4 4 0 00-5.5 0l-2 2a4 4 0 005.5 5.5l1-1" />
                  </svg>
                  Copy link
                </button>

                {/* Public Access */}
                <div className="share-section">
                  <div className="share-section-title">PERMISSIONS</div>
                  <div className="share-permission-row">
                    <div className="share-permission-info">
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <circle cx="9" cy="9" r="7" />
                        <line x1="2" y1="9" x2="16" y2="9" />
                        <ellipse cx="9" cy="9" rx="3" ry="7" />
                      </svg>
                      <span>Anyone with a link</span>
                    </div>
                    <select
                      className="share-role-select"
                      value={publicAccessValue}
                      onChange={e => handlePublicAccessChange(e.target.value)}
                    >
                      <option value="none">has no access</option>
                      <option value="viewer">can view</option>
                      <option value="editor">can edit</option>
                    </select>
                  </div>

                  {/* Existing Shares */}
                  {shareSettings.shares.map(share => (
                    <div key={share.email} className="share-permission-row">
                      <div className="share-permission-info">
                        <div className="share-avatar">{share.email[0].toUpperCase()}</div>
                        <span className="share-email">{share.email}</span>
                      </div>
                      <select
                        className="share-role-select"
                        value={share.role}
                        onChange={e => handleUpdateShareRole(share.email, e.target.value as 'viewer' | 'editor')}
                      >
                        <option value="viewer">can view</option>
                        <option value="editor">can edit</option>
                      </select>
                      <button className="share-remove-btn" onClick={() => handleRemoveShare(share.email)}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Invite */}
                <div className="share-invite-row">
                  <span className="share-invite-label">Invite</span>
                  <select
                    className="share-role-select small"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'viewer' | 'editor')}
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                  </select>
                  <input
                    ref={emailInputRef}
                    className="share-email-input"
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                  />
                  <button className="share-invite-btn" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                    Invite
                  </button>
                </div>

                {/* Share URL display */}
                {shareUrl && (
                  <div className="share-url-display">
                    <input className="share-url-input" readOnly value={shareUrl} onClick={e => (e.target as HTMLInputElement).select()} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="share-tab-content">
            <div className="export-options">
              <button
                className="export-option-btn"
                onClick={() => handleExport('png')}
                disabled={exporting}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="export-option-title">PNG Image</span>
                <span className="export-option-desc">High-quality rasterized image</span>
              </button>

              <button
                className="export-option-btn"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span className="export-option-title">PDF Document</span>
                <span className="export-option-desc">Printable document format</span>
              </button>
            </div>
            {exporting && <p className="export-progress">Generating export...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
