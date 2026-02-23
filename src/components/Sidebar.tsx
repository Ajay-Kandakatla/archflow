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

// Clean SVG icons for sidebar rail (20x20 viewBox, stroke-based for consistency)
const RAIL_ICONS: Record<string, React.ReactNode> = {
  system: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="10" x2="16" y2="10"/>
    </svg>
  ),
  shapes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15.5" cy="15.5" r="6"/><rect x="2" y="2" width="12" height="12" rx="1"/>
    </svg>
  ),
  wireframe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>
    </svg>
  ),
  icons: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><line x1="22" y1="8.5" x2="12" y2="15.5"/><line x1="2" y1="8.5" x2="12" y2="15.5"/>
    </svg>
  ),
  groups: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="22" height="22" rx="3" strokeDasharray="4 2"/><rect x="5" y="5" width="6" height="6" rx="1"/><rect x="13" y="13" width="6" height="6" rx="1"/>
    </svg>
  ),
  notes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 3 14 9 21 9"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="7" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  connectors: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="3"/><circle cx="19" cy="18" r="3"/><path d="M8 6h4a4 4 0 014 4v4"/>
      <polyline points="16 15 19 18 16 21"/>
    </svg>
  ),
  ai: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
    </svg>
  ),
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
            <span className="sidebar-rail-icon">{RAIL_ICONS[tab.id]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className={`sidebar-rail-btn ${aiActive ? 'active' : ''}`}
          onClick={onToggleAi}
          title="AI Generate"
        >
          <span className="sidebar-rail-icon">{RAIL_ICONS.ai}</span>
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
