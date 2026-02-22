import React, { useCallback } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import type { TextFormatting } from '@/types';

/**
 * Floating text formatting toolbar — appears above the selected node or note.
 * Provides font size control, bold, and italic toggles.
 */
export function TextToolbar() {
  const { state, dispatch } = useDiagram();

  // Determine what's selected
  const selectedNodeId = state.selectedNode;
  const selectedNoteId = state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null;

  const selectedNode = selectedNodeId ? state.nodes.find(n => n.id === selectedNodeId) : null;
  const selectedNote = selectedNoteId ? state.stickyNotes.find(n => n.id === selectedNoteId) : null;

  // Nothing selected, don't show toolbar
  if (!selectedNode && !selectedNote) return null;

  // Get current formatting
  let currentFormat: TextFormatting;
  let elementId: string;
  let elementX: number;
  let elementY: number;
  let elementWidth: number;

  if (selectedNode) {
    currentFormat = selectedNode.titleFormat || {};
    const el = document.getElementById('node-' + selectedNode.id);
    elementWidth = el?.offsetWidth || 170;
    elementX = selectedNode.x;
    elementY = selectedNode.y;
    elementId = 'node-' + selectedNode.id;
  } else {
    currentFormat = selectedNote!.textFormat || {};
    elementWidth = selectedNote!.width || 200;
    elementX = selectedNote!.x;
    elementY = selectedNote!.y;
    elementId = 'note-' + selectedNote!.id;
  }

  const fontSize = currentFormat.fontSize || 13;
  const isBold = currentFormat.bold || false;
  const isItalic = currentFormat.italic || false;

  // Position toolbar above the element
  const toolbarX = elementX + elementWidth / 2;
  const toolbarY = elementY - 48;

  const updateFormat = (format: TextFormatting) => {
    if (selectedNode) {
      // Apply to both title and desc
      dispatch({ type: 'UPDATE_NODE_FORMAT', payload: { id: selectedNode.id, field: 'titleFormat', format } });
      dispatch({ type: 'UPDATE_NODE_FORMAT', payload: { id: selectedNode.id, field: 'descFormat', format } });
    } else if (selectedNote) {
      dispatch({ type: 'UPDATE_NOTE_FORMAT', payload: { id: selectedNote.id, format } });
    }
  };

  const decreaseFont = () => updateFormat({ fontSize: Math.max(9, fontSize - 1) });
  const increaseFont = () => updateFormat({ fontSize: Math.min(32, fontSize + 1) });
  const resetFont = () => updateFormat({ fontSize: 13 });
  const toggleBold = () => updateFormat({ bold: !isBold });
  const toggleItalic = () => updateFormat({ italic: !isItalic });

  return (
    <div
      className="text-toolbar"
      style={{
        left: toolbarX,
        top: toolbarY,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Font size controls */}
      <button className="text-toolbar-btn" onClick={decreaseFont} title="Decrease font size">
        −
      </button>
      <button className="text-toolbar-size" onClick={resetFont} title="Reset to default (click)">
        {fontSize === 13 ? 'Auto' : fontSize}
      </button>
      <button className="text-toolbar-btn" onClick={increaseFont} title="Increase font size">
        +
      </button>

      <div className="text-toolbar-divider" />

      {/* Bold */}
      <button
        className={`text-toolbar-btn ${isBold ? 'active' : ''}`}
        onClick={toggleBold}
        title="Bold"
      >
        <strong>B</strong>
      </button>

      {/* Italic */}
      <button
        className={`text-toolbar-btn ${isItalic ? 'active' : ''}`}
        onClick={toggleItalic}
        title="Italic"
      >
        <em>I</em>
      </button>

      <div className="text-toolbar-divider" />

      {/* Close / Deselect */}
      <button
        className="text-toolbar-btn text-toolbar-close"
        onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}
