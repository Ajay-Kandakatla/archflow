import React, { useState, useRef, useEffect } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { CV, CV_LIGHT } from '@/store/constants';
import type { TextFormatting, TextAlign, ListStyle, NodeColor, BorderStyle } from '@/types';

const COLOR_ORDER: NodeColor[] = ['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'pink', 'yellow'];
const SIZE_PRESETS = [
  { label: 'XS', size: 10 },
  { label: 'S', size: 12 },
  { label: 'M', size: 13 },
  { label: 'L', size: 16 },
  { label: 'XL', size: 20 },
  { label: '2X', size: 24 },
  { label: '3X', size: 28 },
  { label: '4X', size: 32 },
];

/**
 * Add bullet/number prefixes to text lines.
 */
function addListPrefixes(text: string, style: ListStyle): string {
  const lines = text.split('\n');
  let counter = 0;
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line; // keep blank lines as-is
    counter++;
    if (style === 'bullet') return `• ${trimmed}`;
    if (style === 'numbered') return `${counter}. ${trimmed}`;
    return line;
  }).join('\n');
}

/**
 * Strip bullet/number prefixes from text lines.
 */
function stripListPrefixes(text: string): string {
  return text.split('\n').map(line => {
    // Strip "• ", "- ", "* " prefixes
    let s = line.replace(/^[\s]*[•\-\*]\s/, '');
    // Strip "1. ", "2. ", etc.
    s = s.replace(/^[\s]*\d+\.\s/, '');
    return s;
  }).join('\n');
}

/**
 * Floating text formatting toolbar — appears above the selected node or note.
 */
export function TextToolbar() {
  const { state, dispatch } = useDiagram();
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showNodeColorMenu, setShowNodeColorMenu] = useState(false);
  const sizeMenuRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const nodeColorMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false);
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
      if (nodeColorMenuRef.current && !nodeColorMenuRef.current.contains(e.target as Node)) {
        setShowNodeColorMenu(false);
      }
    };
    if (showSizeMenu || showColorMenu || showNodeColorMenu) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showSizeMenu, showColorMenu, showNodeColorMenu]);

  // Determine what's selected
  const selectedNodeId = state.selectedNode;
  const selectedNoteId = state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null;

  const selectedNode = selectedNodeId ? state.nodes.find(n => n.id === selectedNodeId) : null;
  const selectedNote = selectedNoteId ? state.stickyNotes.find(n => n.id === selectedNoteId) : null;

  if (!selectedNode && !selectedNote) return null;

  // Get current formatting & text
  let currentFormat: TextFormatting;
  let currentText: string = '';
  let elementX: number;
  let elementY: number;
  let elementWidth: number;

  if (selectedNode) {
    currentFormat = selectedNode.titleFormat || {};
    currentText = selectedNode.desc || '';
    const el = document.getElementById('node-' + selectedNode.id);
    elementWidth = selectedNode.width || el?.offsetWidth || 170;
    elementX = selectedNode.x;
    elementY = selectedNode.y;
  } else {
    currentFormat = selectedNote!.textFormat || {};
    currentText = selectedNote!.text || '';
    elementWidth = selectedNote!.width || 200;
    elementX = selectedNote!.x;
    elementY = selectedNote!.y;
  }

  const colorMap = state.theme === 'light' ? CV_LIGHT : CV;
  const fontSize = currentFormat.fontSize || 13;
  const isBold = currentFormat.bold || false;
  const isItalic = currentFormat.italic || false;
  const isUnderline = currentFormat.underline || false;
  const isStrikethrough = currentFormat.strikethrough || false;
  const textAlign: TextAlign = currentFormat.textAlign || 'left';
  const listStyle: ListStyle = currentFormat.listStyle || 'none';
  const lineHeight = currentFormat.lineHeight || 1.5;
  const textColor = currentFormat.textColor || '';

  const toolbarX = elementX + elementWidth / 2;
  const toolbarY = elementY - 48;

  const updateFormat = (format: TextFormatting) => {
    if (selectedNode) {
      dispatch({ type: 'UPDATE_NODE_FORMAT', payload: { id: selectedNode.id, field: 'titleFormat', format } });
      dispatch({ type: 'UPDATE_NODE_FORMAT', payload: { id: selectedNode.id, field: 'descFormat', format } });
    } else if (selectedNote) {
      dispatch({ type: 'UPDATE_NOTE_FORMAT', payload: { id: selectedNote.id, format } });
    }
  };

  const updateText = (text: string) => {
    if (selectedNode) {
      dispatch({ type: 'UPDATE_NODE_DESC', payload: { id: selectedNode.id, desc: text } });
    } else if (selectedNote) {
      dispatch({ type: 'UPDATE_NOTE_TEXT', payload: { id: selectedNote.id, text } });
    }
  };

  const decreaseFont = () => updateFormat({ fontSize: Math.max(9, fontSize - 1) });
  const increaseFont = () => updateFormat({ fontSize: Math.min(32, fontSize + 1) });
  const toggleBold = () => updateFormat({ bold: !isBold });
  const toggleItalic = () => updateFormat({ italic: !isItalic });
  const toggleUnderline = () => updateFormat({ underline: !isUnderline });
  const toggleStrikethrough = () => updateFormat({ strikethrough: !isStrikethrough });

  const cycleAlign = () => {
    const order: TextAlign[] = ['left', 'center', 'right'];
    const idx = order.indexOf(textAlign);
    updateFormat({ textAlign: order[(idx + 1) % order.length] });
  };

  const cycleLineHeight = () => {
    const order = [1.0, 1.5, 2.0];
    const idx = order.indexOf(lineHeight);
    updateFormat({ lineHeight: order[(idx + 1) % order.length] });
  };

  const handleListToggle = () => {
    const order: ListStyle[] = ['none', 'bullet', 'numbered'];
    const idx = order.indexOf(listStyle);
    const newStyle = order[(idx + 1) % order.length];

    // First strip any existing prefixes
    const cleanText = stripListPrefixes(currentText);

    if (newStyle === 'none') {
      updateText(cleanText);
    } else {
      updateText(addListPrefixes(cleanText, newStyle));
    }
    updateFormat({ listStyle: newStyle });
  };

  // Node color (border/accent color of the node itself)
  const nodeColor: NodeColor = selectedNode ? selectedNode.color : 'blue';
  const nodeBorderStyle: BorderStyle = selectedNode?.borderStyle || 'solid';

  const setNodeColor = (color: NodeColor) => {
    if (selectedNode) {
      dispatch({ type: 'UPDATE_NODE_COLOR', payload: { id: selectedNode.id, color } });
    }
    setShowNodeColorMenu(false);
  };

  const toggleBorderStyle = () => {
    if (selectedNode) {
      const newStyle: BorderStyle = nodeBorderStyle === 'solid' ? 'dashed' : 'solid';
      dispatch({ type: 'UPDATE_NODE_BORDER_STYLE', payload: { id: selectedNode.id, borderStyle: newStyle } });
    }
  };

  const setTextColor = (color: string) => {
    updateFormat({ textColor: color });
    setShowColorMenu(false);
  };

  const alignLabel = textAlign === 'center' ? 'Center' : textAlign === 'right' ? 'Right' : 'Left';
  const listLabel = listStyle === 'bullet' ? 'Bulleted' : listStyle === 'numbered' ? 'Numbered' : 'No list';

  // Build textDecoration string for strikethrough preview
  const textDeco: string[] = [];
  if (isUnderline) textDeco.push('underline');
  if (isStrikethrough) textDeco.push('line-through');

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
      {/* Font size controls with dropdown */}
      <button className="text-toolbar-btn" onClick={decreaseFont} title="Decrease font size">−</button>
      <div style={{ position: 'relative' }} ref={sizeMenuRef}>
        <button
          className="text-toolbar-size"
          onClick={() => setShowSizeMenu(!showSizeMenu)}
          title="Font size (click for presets)"
        >
          {fontSize}
          <span style={{ fontSize: '8px', marginLeft: '2px', opacity: 0.6 }}>▾</span>
        </button>
        {showSizeMenu && (
          <div className="text-toolbar-dropdown">
            {SIZE_PRESETS.map(p => (
              <button
                key={p.size}
                className={`text-toolbar-dropdown-item ${fontSize === p.size ? 'active' : ''}`}
                onClick={() => { updateFormat({ fontSize: p.size }); setShowSizeMenu(false); }}
              >
                <span className="dropdown-label">{p.label}</span>
                <span className="dropdown-value">{p.size}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="text-toolbar-btn" onClick={increaseFont} title="Increase font size">+</button>

      <div className="text-toolbar-divider" />

      {/* Bold */}
      <button className={`text-toolbar-btn ${isBold ? 'active' : ''}`} onClick={toggleBold} title="Bold (whole element)">
        <strong>B</strong>
      </button>

      {/* Italic */}
      <button className={`text-toolbar-btn ${isItalic ? 'active' : ''}`} onClick={toggleItalic} title="Italic">
        <em>I</em>
      </button>

      {/* Underline */}
      <button className={`text-toolbar-btn ${isUnderline ? 'active' : ''}`} onClick={toggleUnderline} title="Underline">
        <span style={{ textDecoration: 'underline' }}>U</span>
      </button>

      {/* Strikethrough */}
      <button className={`text-toolbar-btn ${isStrikethrough ? 'active' : ''}`} onClick={toggleStrikethrough} title="Strikethrough">
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </button>

      <div className="text-toolbar-divider" />

      {/* List Style — cycle: none → bullet → numbered (with actual text transform) */}
      <button
        className={`text-toolbar-btn ${listStyle !== 'none' ? 'active' : ''}`}
        onClick={handleListToggle}
        title={`List: ${listLabel} (click to cycle)`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          {listStyle === 'numbered' ? (
            <>
              <text x="0" y="4" fontSize="5" fontWeight="bold">1</text>
              <rect x="5" y="1" width="9" height="1.5" rx="0.75" />
              <text x="0" y="8.5" fontSize="5" fontWeight="bold">2</text>
              <rect x="5" y="5.5" width="9" height="1.5" rx="0.75" />
              <text x="0" y="13" fontSize="5" fontWeight="bold">3</text>
              <rect x="5" y="10" width="9" height="1.5" rx="0.75" />
            </>
          ) : (
            <>
              <circle cx="1.5" cy="2" r="1.5" />
              <rect x="5" y="1" width="9" height="1.5" rx="0.75" />
              <circle cx="1.5" cy="6.5" r="1.5" />
              <rect x="5" y="5.5" width="9" height="1.5" rx="0.75" />
              <circle cx="1.5" cy="11" r="1.5" />
              <rect x="5" y="10" width="9" height="1.5" rx="0.75" />
            </>
          )}
        </svg>
      </button>

      {/* Text Alignment — cycle: left → center → right */}
      <button
        className={`text-toolbar-btn ${textAlign !== 'left' ? 'active' : ''}`}
        onClick={cycleAlign}
        title={`Align: ${alignLabel} (click to cycle)`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          {textAlign === 'left' ? (
            <>
              <rect x="0" y="1" width="14" height="1.5" rx="0.75" />
              <rect x="0" y="5" width="9" height="1.5" rx="0.75" />
              <rect x="0" y="9" width="12" height="1.5" rx="0.75" />
            </>
          ) : textAlign === 'center' ? (
            <>
              <rect x="0" y="1" width="14" height="1.5" rx="0.75" />
              <rect x="2.5" y="5" width="9" height="1.5" rx="0.75" />
              <rect x="1" y="9" width="12" height="1.5" rx="0.75" />
            </>
          ) : (
            <>
              <rect x="0" y="1" width="14" height="1.5" rx="0.75" />
              <rect x="5" y="5" width="9" height="1.5" rx="0.75" />
              <rect x="2" y="9" width="12" height="1.5" rx="0.75" />
            </>
          )}
        </svg>
      </button>

      <div className="text-toolbar-divider" />

      {/* Line Height */}
      <button
        className={`text-toolbar-btn ${lineHeight !== 1.5 ? 'active' : ''}`}
        onClick={cycleLineHeight}
        title={`Line height: ${lineHeight}× (click to cycle)`}
      >
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '-0.5px' }}>{lineHeight}×</span>
      </button>

      {/* Node Color (border/accent) — only for nodes */}
      {selectedNode && (
        <>
          <div style={{ position: 'relative' }} ref={nodeColorMenuRef}>
            <button
              className="text-toolbar-btn"
              onClick={() => setShowNodeColorMenu(!showNodeColorMenu)}
              title="Node color"
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, background: colorMap[nodeColor], border: '2px solid rgba(255,255,255,0.3)' }} />
            </button>
            {showNodeColorMenu && (
              <div className="text-toolbar-color-menu">
                {COLOR_ORDER.map(c => (
                  <button
                    key={c}
                    className={`text-toolbar-color-swatch ${nodeColor === c ? 'active' : ''}`}
                    style={{ background: colorMap[c] }}
                    onClick={() => setNodeColor(c)}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Border Style Toggle */}
          <button
            className={`text-toolbar-btn ${nodeBorderStyle === 'dashed' ? 'active' : ''}`}
            onClick={toggleBorderStyle}
            title={`Border: ${nodeBorderStyle} (click to toggle)`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              {nodeBorderStyle === 'dashed' ? (
                <>
                  <line x1="0" y1="7" x2="3" y2="7" strokeDasharray="0" />
                  <line x1="5" y1="7" x2="9" y2="7" strokeDasharray="0" />
                  <line x1="11" y1="7" x2="14" y2="7" strokeDasharray="0" />
                </>
              ) : (
                <line x1="0" y1="7" x2="14" y2="7" />
              )}
            </svg>
          </button>

          <div className="text-toolbar-divider" />
        </>
      )}

      {/* Text Color */}
      <div style={{ position: 'relative' }} ref={colorMenuRef}>
        <button
          className={`text-toolbar-btn ${textColor ? 'active' : ''}`}
          onClick={() => setShowColorMenu(!showColorMenu)}
          title="Text color"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <text x="2" y="10" fontSize="11" fontWeight="bold" fill={textColor ? (colorMap[textColor as NodeColor] || 'currentColor') : 'currentColor'}>A</text>
            <rect x="0" y="12" width="14" height="2.5" rx="1" fill={textColor ? (colorMap[textColor as NodeColor] || 'currentColor') : 'currentColor'} />
          </svg>
        </button>
        {showColorMenu && (
          <div className="text-toolbar-color-menu">
            <button
              className={`text-toolbar-color-swatch ${!textColor ? 'active' : ''}`}
              onClick={() => setTextColor('')}
              title="Default"
            >
              <span style={{ fontSize: '10px' }}>Auto</span>
            </button>
            {COLOR_ORDER.map(c => (
              <button
                key={c}
                className={`text-toolbar-color-swatch ${textColor === c ? 'active' : ''}`}
                style={{ background: colorMap[c] }}
                onClick={() => setTextColor(c)}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

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
