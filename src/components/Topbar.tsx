import React, { useState, useRef, useEffect } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import type { ToolMode } from '@/types';

interface TopbarProps {
  diagramName: string;
  onRenameDiagram: (newName?: string) => void;
  onSave: () => void;
  onExport: () => void;
  onShowTemplates: () => void;
  onToggleProjects: () => void;
  onToggleTheme: () => void;
  onTriggerImageUpload: () => void;
  onSignOut: () => void;
  onShowAdmin: () => void;
  onToggleUserMenu: () => void;
  userMenuOpen: boolean;
  isReadOnly?: boolean;
}

export function Topbar({
  diagramName, onRenameDiagram, onSave, onExport, onShowTemplates,
  onToggleProjects, onToggleTheme, onTriggerImageUpload, onSignOut,
  onShowAdmin, onToggleUserMenu, userMenuOpen, isReadOnly,
}: TopbarProps) {
  const { state, dispatch } = useDiagram();
  const { currentTool, scale, currentUser, theme } = state;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(diagramName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync nameValue when diagramName prop changes
  useEffect(() => { setNameValue(diagramName); }, [diagramName]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const saveName = () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== diagramName) {
      onRenameDiagram(nameValue.trim());
    } else {
      setNameValue(diagramName);
    }
  };

  const setTool = (t: ToolMode) => dispatch({ type: 'SET_TOOL', payload: t });

  const zoomIn = () => {
    const newScale = Math.min(3, state.scale * 1.15);
    dispatch({ type: 'SET_ZOOM', payload: { scale: newScale, panX: state.panX, panY: state.panY } });
  };
  const zoomOut = () => {
    const newScale = Math.max(0.15, state.scale / 1.15);
    dispatch({ type: 'SET_ZOOM', payload: { scale: newScale, panX: state.panX, panY: state.panY } });
  };
  const resetZoom = () => {
    dispatch({ type: 'SET_ZOOM', payload: { scale: 1, panX: 0, panY: 0 } });
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo-icon">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="16" cy="13" r="2.5" fill="white"/>
            <line x1="16" y1="15.5" x2="16" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="18" x2="16" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="20" y1="18" x2="16" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="logo">ArchFlow</span>
        {!isReadOnly && (
          <button className="tool-btn" id="projectsBtn" onClick={onToggleProjects} title="Projects">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            Projects
          </button>
        )}
        {!isReadOnly && editingName ? (
          <input
            ref={nameInputRef}
            className="diagram-name-input"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameValue(diagramName); setEditingName(false); } }}
          />
        ) : (
          <span className="diagram-name-display" id="diagramName" onClick={!isReadOnly ? () => setEditingName(true) : undefined} title={isReadOnly ? diagramName : 'Click to rename'} style={isReadOnly ? { cursor: 'default' } : undefined}>
            {diagramName}
          </span>
        )}
      </div>


      <div className="topbar-right">
        <button className="theme-toggle" id="themeToggle" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut}>−</button>
          <span className="zoom-level" id="zoomLevel">{Math.round(scale * 100)}%</span>
          <button className="zoom-btn" onClick={zoomIn}>+</button>
          <button className="zoom-btn" onClick={resetZoom} title="Reset">⟳</button>
        </div>
        {!isReadOnly && (
          <>
            <a href="/docs" className="action-btn btn-docs" title="Documentation">Docs</a>
            <button className="action-btn btn-templates" onClick={onShowTemplates}>Templates</button>
            <button className="action-btn btn-save" onClick={onSave}>Save</button>
            <button className="action-btn btn-share" onClick={onExport}>Share</button>
          </>
        )}
        {isReadOnly && !currentUser && (
          <a href="/" className="action-btn btn-signin">Sign in</a>
        )}

        <div id="authArea">
          {currentUser ? (
            <img className="user-avatar" src={currentUser.picture || ''} alt={currentUser.name}
              onClick={onToggleUserMenu} referrerPolicy="no-referrer" />
          ) : (
            !isReadOnly && <div id="googleSignInButtonHeader" />
          )}
        </div>

        {userMenuOpen && currentUser && (
          <div className="user-menu show" id="userMenu">
            <div className="user-menu-header">
              <div className="name" id="userMenuName">{currentUser.name}</div>
              <div className="email" id="userMenuEmail">{currentUser.email}</div>
            </div>
            {currentUser.email.toLowerCase() === 'ajaykandakatla@gmail.com' && (
              <div className="user-menu-item" onClick={onShowAdmin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Admin Dashboard
              </div>
            )}
            {currentUser.email.toLowerCase() === 'ajaykandakatla@gmail.com' && (
              <a href="/dev-docs" className="user-menu-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l2-2-2-2"/><path d="M8 6L6 8l2 2"/><path d="M14.5 4l-5 16"/></svg>
                Developer Docs
              </a>
            )}
            <a href="/docs" className="user-menu-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              Documentation
            </a>
            <div className="user-menu-item user-menu-signout" onClick={onSignOut}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
