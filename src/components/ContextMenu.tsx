import React from 'react';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onAddNote: (color: string) => void;
  onAddGroup: (color: string) => void;
  onSelectAll: () => void;
  onFitToScreen: () => void;
  onClearCanvas: () => void;
  onGroupSelected: () => void;
  hasSelection: boolean;
  onClose: () => void;
}

// Small inline SVG icon helper (14x14, stroke-based)
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);

// Colored circle for note/group items
const ColorDot = ({ color }: { color: string }) => (
  <span style={{
    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
    background: color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)',
  }} />
);

// Note colors
const NOTE_COLORS: Record<string, string> = {
  yellow: '#fde68a',
  blue: '#93c5fd',
  green: '#86efac',
  pink: '#f9a8d4',
};

// Group colors
const GROUP_COLORS: Record<string, string> = {
  blue: '#6b9fdb',
  purple: '#9b8acc',
  green: '#5bbf9a',
};

export function ContextMenu({
  visible, x, y, onAddNote, onAddGroup, onSelectAll, onFitToScreen, onClearCanvas, onGroupSelected, hasSelection, onClose,
}: ContextMenuProps) {
  if (!visible) return null;

  return (
    <div
      className="context-menu"
      id="contextMenu"
      style={{ display: 'block', left: x, top: y }}
      onMouseLeave={onClose}
    >
      <div className="context-menu-section-label">Add Note</div>
      {Object.entries(NOTE_COLORS).map(([key, color]) => (
        <div key={key} className="context-menu-item" onClick={() => { onAddNote(key); onClose(); }}>
          <ColorDot color={color} />
          {key.charAt(0).toUpperCase() + key.slice(1)} Note
        </div>
      ))}

      <div className="context-menu-divider" />
      <div className="context-menu-section-label">Add Group</div>
      {Object.entries(GROUP_COLORS).map(([key, color]) => (
        <div key={key} className="context-menu-item" onClick={() => { onAddGroup(key); onClose(); }}>
          <ColorDot color={color} />
          {key.charAt(0).toUpperCase() + key.slice(1)} Group
        </div>
      ))}

      <div className="context-menu-divider" />

      {hasSelection && (
        <div className="context-menu-item" onClick={() => { onGroupSelected(); onClose(); }}>
          <Icon><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="1" y="1" width="22" height="22" rx="3" strokeDasharray="3 2"/></Icon>
          Group Selection
        </div>
      )}
      <div className="context-menu-item" onClick={() => { onSelectAll(); onClose(); }}>
        <Icon><path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z"/><path d="M9 12l2 2 4-4"/></Icon>
        Select All
      </div>
      <div className="context-menu-item" onClick={() => { onFitToScreen(); onClose(); }}>
        <Icon><path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M21 8V5a2 2 0 00-2-2h-3"/><path d="M3 16v3a2 2 0 002 2h3"/><path d="M16 21h3a2 2 0 002-2v-3"/></Icon>
        Fit to Screen
      </div>

      <div className="context-menu-divider" />
      <div className="context-menu-item context-menu-danger" onClick={() => { onClearCanvas(); onClose(); }}>
        <Icon><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></Icon>
        Clear Canvas
      </div>
    </div>
  );
}
