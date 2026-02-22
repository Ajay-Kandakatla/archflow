import React, { useState } from 'react';
import { CT, SIDEBAR_SECTIONS } from '@/store/constants';
import { NodeIcon } from '@/components/NodeIcon';

interface SidebarProps {
  onClickAdd: (type: string) => void;
  onClickAddGroup: (color: string) => void;
  panelOpen?: string | null;
  onTabChange?: (tabId: string | null) => void;
  onToggleAi?: () => void;
  aiActive?: boolean;
}

// Tab definitions with icons and category mappings
const TABS = [
  { id: 'system', icon: '🏗️', label: 'System Blocks', sections: [0, 1, 2, 3, 4, 5] }, // All system categories
  { id: 'shapes', icon: '◇', label: 'Shapes', sections: [] as number[] }, // Empty blocks / basic shapes
  { id: 'groups', icon: '▢', label: 'Groups', sections: [] as number[] }, // Group containers
  { id: 'notes', icon: '📝', label: 'Notes', sections: [] as number[] }, // Sticky notes
  { id: 'connectors', icon: '⤷', label: 'Connectors', sections: [] as number[] }, // Connection tools
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
            <span className="sidebar-rail-icon">{tab.icon}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className={`sidebar-rail-btn ${aiActive ? 'active' : ''}`}
          onClick={onToggleAi}
          title="AI Generate"
        >
          <span className="sidebar-rail-icon">✨</span>
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
                {activeTab === 'system' ? 'S' : activeTab === 'shapes' ? 'D' : activeTab === 'groups' ? 'G' : activeTab === 'notes' ? 'N' : 'C'}
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
