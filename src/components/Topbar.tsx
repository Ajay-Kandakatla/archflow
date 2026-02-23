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

      {!isReadOnly && (
        <div className="topbar-center">
          <button className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`} id="selectTool" onClick={() => setTool('select')} title="Select & Move (V)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
            Select
          </button>
          <button className={`tool-btn ${currentTool === 'connect' ? 'active' : ''}`} id="connectTool" onClick={() => setTool('connect')} title="Connect (C)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Connect
          </button>
          <button className={`tool-btn ${currentTool === 'note' ? 'active' : ''}`} id="noteTool" onClick={() => setTool('note')} title="Sticky Note (N)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.5 3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 2 14 8 20 8"/></svg>
            Note
          </button>
          <button className="tool-btn" id="imageTool" onClick={onTriggerImageUpload} title="Add Image (I)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Image
          </button>
        </div>
      )}

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
              <div className="user-menu-item" onClick={onShowAdmin}>Admin Dashboard</div>
            )}
            <div className="user-menu-item" onClick={onSignOut}>Sign out</div>
          </div>
        )}
      </div>
    </div>
  );
}
