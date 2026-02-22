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
      <div className="context-menu-item" onClick={() => { onAddNote('yellow'); onClose(); }}>📒 Yellow Note</div>
      <div className="context-menu-item" onClick={() => { onAddNote('blue'); onClose(); }}>📘 Blue Note</div>
      <div className="context-menu-item" onClick={() => { onAddNote('green'); onClose(); }}>📗 Green Note</div>
      <div className="context-menu-item" onClick={() => { onAddNote('pink'); onClose(); }}>📕 Pink Note</div>
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => { onAddGroup('blue'); onClose(); }}>▢ Blue Group</div>
      <div className="context-menu-item" onClick={() => { onAddGroup('purple'); onClose(); }}>▢ Purple Group</div>
      <div className="context-menu-item" onClick={() => { onAddGroup('green'); onClose(); }}>▢ Green Group</div>
      <div className="context-menu-divider" />
      {hasSelection && (
        <div className="context-menu-item" onClick={() => { onGroupSelected(); onClose(); }}>⊞ Group Selection</div>
      )}
      <div className="context-menu-item" onClick={() => { onSelectAll(); onClose(); }}>Select All</div>
      <div className="context-menu-item" onClick={() => { onFitToScreen(); onClose(); }}>Fit to Screen</div>
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => { onClearCanvas(); onClose(); }}>Clear Canvas</div>
    </div>
  );
}
