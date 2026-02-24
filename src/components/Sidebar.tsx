import React, { useState, useMemo } from 'react';
import { CT, SIDEBAR_SECTIONS, WIREFRAME_SECTIONS, ICON_NODE_TYPE } from '@/store/constants';
import { NodeIcon } from '@/components/NodeIcon';
import { ICON_CATEGORIES, ALL_ICONS, renderIcon } from '@/components/IconLibrary';

interface SidebarProps {
  onClickAdd: (type: string, extra?: { iconSvg?: string; iconName?: string }) => void;
  onClickAddGroup: (color: string) => void;
  panelOpen?: string | null;
  onTabChange?: (tabId: string | null) => void;
  onToggleAi?: () => void;
  aiActive?: boolean;
}

// SVG icons + labels for sidebar rail — each designed to be immediately recognizable
const RAIL_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  system: {
    label: 'System',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Server rack — two horizontal servers with indicator lights */}
        <rect x="2" y="3" width="20" height="7" rx="1.5"/>
        <circle cx="5.5" cy="6.5" r="1.2" fill="currentColor"/>
        <rect x="2" y="14" width="20" height="7" rx="1.5"/>
        <circle cx="5.5" cy="17.5" r="1.2" fill="currentColor"/>
        <line x1="9" y1="10" x2="9" y2="14"/><line x1="15" y1="10" x2="15" y2="14"/>
      </svg>
    ),
  },
  shapes: {
    label: 'Shapes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Three distinct shapes: rectangle (top-left), circle (top-right), triangle (bottom) */}
        <rect x="1" y="2" width="9" height="8" rx="1.5"/>
        <circle cx="17.5" cy="6" r="4.5"/>
        <polygon points="12,14 22.5,23 1.5,23"/>
      </svg>
    ),
  },
  wireframe: {
    label: 'UI Kit',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <rect x="6" y="12" width="5" height="3" rx="0.5" fill="currentColor" fillOpacity="0.15"/>
        <line x1="6" y1="18" x2="18" y2="18" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  icons: {
    label: 'Icons',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* 2×2 symbol grid — represents an icon library/gallery */}
        <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.2"/>
        <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" fillOpacity="0.2"/>
      </svg>
    ),
  },
  groups: {
    label: 'Groups',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="3" strokeDasharray="4 2"/>
        <rect x="5" y="5" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.15"/>
        <rect x="13" y="11" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.15"/>
      </svg>
    ),
  },
  notes: {
    label: 'Notes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h10l6-6V5a2 2 0 00-2-2z"/>
        <path d="M15 21v-6h6"/>
        <line x1="7" y1="8" x2="13" y2="8"/><line x1="7" y1="12" x2="11" y2="12"/>
      </svg>
    ),
  },
  connectors: {
    label: 'Lines',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="5" r="2.5" fill="currentColor" fillOpacity="0.2"/><circle cx="19" cy="19" r="2.5" fill="currentColor" fillOpacity="0.2"/>
        <path d="M7 5h5a4 4 0 014 4v5"/>
        <polyline points="16 16 19 19 16 22"/>
      </svg>
    ),
  },
  ai: {
    label: 'AI',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Lucide-style sparkles — large 4-point star + small cross accents */}
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        <path d="M5 3v4"/><path d="M3 5h4"/>
        <path d="M19 17v4"/><path d="M17 19h4"/>
      </svg>
    ),
  },
};

// Tab definitions with category mappings
const TABS = [
  { id: 'system', label: 'System Blocks', sections: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'shapes', label: 'Shapes', sections: [] as number[] },
  { id: 'wireframe', label: 'Wireframe', sections: [] as number[] },
  { id: 'icons', label: 'Icons', sections: [] as number[] },
  { id: 'groups', label: 'Groups', sections: [] as number[] },
  { id: 'notes', label: 'Notes', sections: [] as number[] },
  { id: 'connectors', label: 'Connectors', sections: [] as number[] },
];

// Basic shapes that can be placed as empty blocks
const BASIC_SHAPES = [
  { type: 'rectangle', icon: '▭', label: 'Rectangle', color: 'blue' },
  { type: 'rounded-rect', icon: '▢', label: 'Rounded', color: 'blue' },
  { type: 'circle', icon: '●', label: 'Circle', color: 'purple' },
  { type: 'diamond', icon: '◆', label: 'Diamond', color: 'green' },
  { type: 'pill', icon: '💊', label: 'Pill', color: 'cyan' },
  { type: 'hexagon', icon: '⬡', label: 'Hexagon', color: 'orange' },
  { type: 'cylinder', icon: '⬭', label: 'Cylinder', color: 'red' },
  { type: 'parallelogram', icon: '▱', label: 'Parallel', color: 'pink' },
];

const FLOWCHART_SHAPES = [
  { type: 'fc-terminator', icon: '⬭', label: 'Start / End', color: 'green' },
  { type: 'fc-process', icon: '▭', label: 'Process', color: 'blue' },
  { type: 'fc-decision', icon: '◆', label: 'Decision', color: 'orange' },
  { type: 'fc-subprocess', icon: '▣', label: 'Subprocess', color: 'purple' },
  { type: 'fc-document', icon: '📄', label: 'Document', color: 'cyan' },
  { type: 'fc-data', icon: '▱', label: 'Data / IO', color: 'yellow' },
  { type: 'fc-database', icon: '⬭', label: 'Database', color: 'red' },
  { type: 'fc-manual', icon: '⏢', label: 'Manual Input', color: 'pink' },
  { type: 'fc-predefined', icon: '⊞', label: 'Predefined', color: 'purple' },
  { type: 'fc-connector', icon: '●', label: 'Connector', color: 'green' },
  { type: 'fc-delay', icon: '▷', label: 'Delay', color: 'orange' },
  { type: 'fc-merge', icon: '▽', label: 'Merge', color: 'cyan' },
];

const GROUP_COLORS = [
  { color: 'blue', label: 'Blue Group' },
  { color: 'green', label: 'Green Group' },
  { color: 'purple', label: 'Purple Group' },
  { color: 'orange', label: 'Orange Group' },
  { color: 'cyan', label: 'Cyan Group' },
  { color: 'pink', label: 'Pink Group' },
];

const NOTE_COLORS = [
  { color: 'yellow', icon: '📒', label: 'Yellow Note' },
  { color: 'blue', icon: '📘', label: 'Blue Note' },
  { color: 'green', icon: '📗', label: 'Green Note' },
  { color: 'pink', icon: '📕', label: 'Pink Note' },
];

export function Sidebar({ onClickAdd, onClickAddGroup, panelOpen, onTabChange, onToggleAi, aiActive }: SidebarProps) {
  // Use controlled state if parent provides it, else local
  const [localTab, setLocalTab] = useState<string | null>(null);
  const activeTab = panelOpen !== undefined ? panelOpen : localTab;
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return null;
    const q = iconSearch.toLowerCase();
    return ALL_ICONS.filter(icon => icon.name.toLowerCase().includes(q));
  }, [iconSearch]);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleGroupDragStart = (e: React.DragEvent, color: string) => {
    e.dataTransfer.setData('groupColor', color);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTabClick = (tabId: string) => {
    const newTab = activeTab === tabId ? null : tabId;
    if (onTabChange) {
      onTabChange(newTab);
    } else {
      setLocalTab(newTab);
    }
  };

  const getShortcutKey = () => {
    switch (activeTab) {
      case 'system': return 'S';
      case 'shapes': return 'D';
      case 'wireframe': return 'W';
      case 'icons': return 'I';
      case 'groups': return 'G';
      case 'notes': return 'N';
      case 'connectors': return 'C';
      default: return '';
    }
  };

  const renderPanelContent = () => {
    switch (activeTab) {
      case 'system':
        return (
          <>
            {SIDEBAR_SECTIONS.map(section => (
              <div className="sidebar-section" key={section.title}>
                <div className="sidebar-title">{section.title}</div>
                <div className="component-grid">
                  {section.items.map(item => {
                    const ct = CT[item.type];
                    return (
                      <div
                        key={item.type}
                        className="component-item"
                        data-type={item.type}
                        data-color={item.color}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        onClick={() => onClickAdd(item.type)}
                      >
                        <span className="component-icon"><NodeIcon type={item.type} fallback={ct?.icon} size={24} /></span>
                        <span className="component-name">{ct?.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        );

      case 'shapes':
        return (
          <>
            <div className="sidebar-section">
              <div className="sidebar-title">Basic Shapes</div>
              <div className="component-grid">
                {BASIC_SHAPES.map(shape => (
                  <div
                    key={shape.type}
                    className="component-item"
                    data-color={shape.color}
                    draggable
                    onDragStart={(e) => handleDragStart(e, shape.type)}
                    onClick={() => onClickAdd(shape.type)}
                  >
                    <span className="component-icon">{shape.icon}</span>
                    <span className="component-name">{shape.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-title">Flowchart</div>
              <div className="component-grid">
                {FLOWCHART_SHAPES.map(shape => (
                  <div
                    key={shape.type}
                    className="component-item"
                    data-color={shape.color}
                    draggable
                    onDragStart={(e) => handleDragStart(e, shape.type)}
                    onClick={() => onClickAdd(shape.type)}
                  >
                    <span className="component-icon">{shape.icon}</span>
                    <span className="component-name">{shape.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'wireframe':
        return (
          <>
            {WIREFRAME_SECTIONS.map(section => (
              <div className="sidebar-section" key={section.title}>
                <div className="sidebar-title">{section.title}</div>
                <div className="component-grid">
                  {section.items.map(shape => (
                    <div
                      key={shape.type}
                      className="component-item"
                      data-type={shape.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shape.type)}
                      onClick={() => onClickAdd(shape.type)}
                    >
                      <span className="component-icon"><NodeIcon type={shape.type} size={24} /></span>
                      <span className="component-name">{shape.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        );

      case 'icons':
        return (
          <>
            <div className="sidebar-section">
              <input
                className="icon-search-input"
                type="text"
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />
            </div>
            {filteredIcons ? (
              <div className="sidebar-section">
                <div className="sidebar-title">Results ({filteredIcons.length})</div>
                <div className="icon-grid">
                  {filteredIcons.map(icon => (
                    <div
                      key={icon.name}
                      className="icon-grid-item"
                      title={icon.name}
                      onClick={() => onClickAdd(ICON_NODE_TYPE, { iconSvg: icon.svg, iconName: icon.name })}
                    >
                      {renderIcon(icon.svg, 22)}
                    </div>
                  ))}
                  {filteredIcons.length === 0 && (
                    <div className="sidebar-help-text" style={{ gridColumn: '1 / -1' }}>
                      <p>No icons found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              ICON_CATEGORIES.map(cat => (
                <div className="sidebar-section" key={cat.label}>
                  <div className="sidebar-title">{cat.label}</div>
                  <div className="icon-grid">
                    {cat.icons.map(icon => (
                      <div
                        key={icon.name}
                        className="icon-grid-item"
                        title={icon.name}
                        onClick={() => onClickAdd(ICON_NODE_TYPE, { iconSvg: icon.svg, iconName: icon.name })}
                      >
                        {renderIcon(icon.svg, 22)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        );

      case 'groups':
        return (
          <div className="sidebar-section">
            <div className="sidebar-title">Group Containers</div>
            <div className="component-grid">
              {GROUP_COLORS.map(g => (
                <div
                  key={g.color}
                  className="component-item"
                  data-color={g.color}
                  draggable
                  onDragStart={(e) => handleGroupDragStart(e, g.color)}
                  onClick={() => onClickAddGroup(g.color)}
                >
                  <span className="component-icon">▢</span>
                  <span className="component-name">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="sidebar-section">
            <div className="sidebar-title">Sticky Notes</div>
            <div className="component-grid">
              {NOTE_COLORS.map(n => (
                <div
                  key={n.color}
                  className="component-item"
                  data-color={n.color}
                  onClick={() => onClickAdd('note-' + n.color)}
                >
                  <span className="component-icon">{n.icon}</span>
                  <span className="component-name">{n.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'connectors':
        return (
          <div className="sidebar-section">
            <div className="sidebar-title">Connection Tools</div>
            <div className="sidebar-help-text">
              <p>🔗 <strong>Draw connections:</strong> Drag from one port to another</p>
              <p>🏷️ <strong>Edit label:</strong> Double-click the label</p>
              <p>↔️ <strong>Toggle direction:</strong> Click the label</p>
              <p>⌐ <strong>Cycle routing:</strong> Right-click the label (bezier → orthogonal → straight)</p>
              <p>✕ <strong>Delete:</strong> Double-click the connection</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Icon Rail */}
      <div className="sidebar-rail">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-rail-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.label}
          >
            <span className="sidebar-rail-icon">{RAIL_ICONS[tab.id]?.icon}</span>
            <span className="sidebar-rail-label">{RAIL_ICONS[tab.id]?.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className={`sidebar-rail-btn ${aiActive ? 'active' : ''}`}
          onClick={onToggleAi}
          title="AI Generate"
        >
          <span className="sidebar-rail-icon">{RAIL_ICONS.ai?.icon}</span>
          <span className="sidebar-rail-label">{RAIL_ICONS.ai?.label}</span>
        </button>
      </div>

      {/* Flyout Panel */}
      <div className={`sidebar-panel ${activeTab ? 'open' : ''}`}>
        {activeTab && (
          <>
            <div className="sidebar-panel-header">
              <span className="sidebar-panel-title">
                {TABS.find(t => t.id === activeTab)?.label}
              </span>
              <span className="sidebar-panel-shortcut">
                {getShortcutKey()}
              </span>
            </div>
            <div className="sidebar-panel-content">
              {renderPanelContent()}
            </div>
          </>
        )}
      </div>

    </>
  );
}
