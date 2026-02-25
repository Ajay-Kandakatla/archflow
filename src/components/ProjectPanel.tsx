import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { API } from '@/utils/api';
import type { DiagramMeta } from '@/types';

// ─── Tree Types ──────────────────────────────────────────────────────────────

interface FolderTreeNode {
  name: string;
  path: string;
  children: FolderTreeNode[];
  diagrams: DiagramMeta[];
}

// ─── Tree Builder ────────────────────────────────────────────────────────────

function buildTree(diagrams: DiagramMeta[]): FolderTreeNode {
  const root: FolderTreeNode = { name: '', path: '', children: [], diagrams: [] };

  for (const d of diagrams) {
    const folder = d.folder || '';
    if (!folder) {
      root.diagrams.push(d);
      continue;
    }

    const segments = folder.split('/');
    let current = root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const partialPath = segments.slice(0, i + 1).join('/');
      let child = current.children.find(c => c.name === seg);
      if (!child) {
        child = { name: seg, path: partialPath, children: [], diagrams: [] };
        current.children.push(child);
      }
      current = child;
    }

    current.diagrams.push(d);
  }

  const sortNode = (node: FolderTreeNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.diagrams.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root;
}

function countDiagrams(node: FolderTreeNode): number {
  return node.diagrams.length + node.children.reduce((sum, c) => sum + countDiagrams(c), 0);
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProjectPanelProps {
  visible: boolean;
  onLoadDiagram: (id: string, role?: 'owner' | 'editor' | 'viewer') => void;
  onNewDiagram: (folder?: string) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ProjectPanel({ visible, onLoadDiagram, onNewDiagram }: ProjectPanelProps) {
  const { state } = useDiagram();
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine');
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([]);
  const [sharedDiagrams, setSharedDiagrams] = useState<DiagramMeta[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState('');
  const [movingDiagram, setMovingDiagram] = useState<DiagramMeta | null>(null);
  const [moveTarget, setMoveTarget] = useState('');

  const loadList = useCallback(async () => {
    if (!state.authToken) return;
    try {
      const list = await API.list();
      setDiagrams(list);
    } catch (e) {
      console.error('Failed to load diagrams:', e);
    }
  }, [state.authToken]);

  const loadSharedList = useCallback(async () => {
    if (!state.authToken) return;
    try {
      const list = await API.getSharedWithMe();
      setSharedDiagrams(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load shared diagrams:', e);
    }
  }, [state.authToken]);

  useEffect(() => {
    if (visible && state.authToken) {
      loadList();
      loadSharedList();
    }
  }, [visible, state.authToken, loadList, loadSharedList]);

  const tree = useMemo(() => buildTree(diagrams), [diagrams]);
  const sharedSorted = useMemo(() => {
    return [...sharedDiagrams].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [sharedDiagrams]);

  const existingFolders = useMemo(() => {
    const folders = new Set<string>();
    diagrams.forEach(d => {
      if (d.folder) {
        const segments = d.folder.split('/');
        for (let i = 1; i <= segments.length; i++) {
          folders.add(segments.slice(0, i).join('/'));
        }
      }
    });
    return Array.from(folders).sort();
  }, [diagrams]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        setCurrentFolder(path);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this diagram?')) return;
    try {
      await API.remove(id);
      setDiagrams(prev => prev.filter(d => d._id !== id));
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  }, []);

  const handleMove = useCallback(async () => {
    if (!movingDiagram) return;
    const cleanPath = moveTarget.trim().replace(/^\/+|\/+$/g, '');
    try {
      await API.update(movingDiagram._id, { folder: cleanPath });
      setDiagrams(prev => prev.map(d =>
        d._id === movingDiagram._id ? { ...d, folder: cleanPath } : d
      ));
      setMovingDiagram(null);
      setMoveTarget('');
    } catch (e) {
      console.error('Failed to move diagram:', e);
    }
  }, [movingDiagram, moveTarget]);

  const openMoveModal = useCallback((e: React.MouseEvent, d: DiagramMeta) => {
    e.stopPropagation();
    setMovingDiagram(d);
    setMoveTarget(d.folder || '');
  }, []);

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderDiagramItem = (d: DiagramMeta, depth: number) => (
    <div
      key={d._id}
      className={`project-item${d._id === state.currentDiagramId ? ' active' : ''}`}
      style={{ paddingLeft: 12 + depth * 16 }}
      onClick={() => onLoadDiagram(d._id)}
    >
      <div className="project-item-info">
        <div className="project-item-name">{d.name}</div>
        <div className="project-item-meta">
          {new Date(d.updatedAt).toLocaleDateString()}
        </div>
      </div>
      <div className="project-item-actions">
        <button
          className="project-item-action"
          onClick={e => openMoveModal(e, d)}
          title="Move to folder"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="9 14 12 11 15 14"/></svg>
        </button>
        <button
          className="project-item-delete"
          onClick={e => handleDelete(e, d._id)}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );

  const renderSharedDiagramItem = (d: DiagramMeta) => {
    const role = d.role || 'viewer';
    return (
      <div
        key={d._id}
        className={`project-item shared${d._id === state.currentDiagramId ? ' active' : ''}`}
        style={{ paddingLeft: 12 }}
        onClick={() => onLoadDiagram(d._id, role)}
      >
        <div className="project-item-info">
          <div className="project-item-name">
            {d.name}
            <span className={`project-role-badge ${role}`}>{role}</span>
          </div>
          <div className="project-item-meta">
            {new Date(d.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  const renderFolder = (node: FolderTreeNode, depth: number) => {
    const isExpanded = expandedFolders.has(node.path);
    const count = countDiagrams(node);

    return (
      <React.Fragment key={node.path}>
        {node.path && (
          <div
            className={`folder-item${isExpanded ? ' expanded' : ''}`}
            style={{ paddingLeft: 12 + depth * 16 }}
            onClick={() => toggleFolder(node.path)}
          >
            <span className="folder-arrow">{isExpanded ? '▾' : '▸'}</span>
            <svg className="folder-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <span className="folder-name">{node.name}</span>
            <span className="folder-count">{count}</span>
          </div>
        )}
        {(isExpanded || !node.path) && (
          <>
            {node.children.map(child => renderFolder(child, node.path ? depth + 1 : depth))}
            {node.diagrams.map(d => renderDiagramItem(d, node.path ? depth + 1 : depth))}
          </>
        )}
      </React.Fragment>
    );
  };

  if (!visible) return null;

  return (
    <div className="project-panel show" id="projectPanel">
      <div className="sidebar-title">Your Diagrams</div>
      <div className="project-tabs">
        <button
          className={`project-tab ${activeTab === 'mine' ? 'active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          Mine
        </button>
        <button
          className={`project-tab ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          Shared with me
          {sharedDiagrams.length > 0 ? <span className="project-tab-count">{sharedDiagrams.length}</span> : null}
        </button>
      </div>

      {activeTab === 'mine' ? (
        <>
          <button className="project-new-btn" onClick={() => onNewDiagram(currentFolder || undefined)}>
            + New Diagram{currentFolder ? ` in ${currentFolder.split('/').pop()}` : ''}
          </button>
          {currentFolder && (
            <button
              className="folder-reset-btn"
              onClick={() => { setCurrentFolder(''); }}
            >
              Create at root instead
            </button>
          )}
          <div id="projectList">
            {renderFolder(tree, 0)}
            {diagrams.length === 0 && (
              <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                No diagrams yet. Create one!
              </div>
            )}
          </div>
        </>
      ) : (
        <div id="projectList">
          {sharedSorted.map(renderSharedDiagramItem)}
          {sharedSorted.length === 0 && (
            <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
              No shared diagrams yet.
            </div>
          )}
        </div>
      )}

      {/* Move-to-Folder Modal */}
      {movingDiagram && (
        <div className="move-modal-overlay" onClick={() => setMovingDiagram(null)}>
          <div className="move-modal" onClick={e => e.stopPropagation()}>
            <div className="move-modal-title">Move &ldquo;{movingDiagram.name}&rdquo;</div>
            <input
              className="move-modal-input"
              value={moveTarget}
              onChange={e => setMoveTarget(e.target.value)}
              placeholder="Folder path (e.g. Projects/2025)"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleMove(); if (e.key === 'Escape') setMovingDiagram(null); }}
            />
            <div className="move-modal-hint">Leave empty for root. Use / to nest (e.g. &ldquo;Work/Designs&rdquo;)</div>
            {existingFolders.length > 0 && (
              <div className="move-modal-suggestions">
                <div className="move-modal-suggestions-label">Existing folders</div>
                <div className="move-modal-suggestion" onClick={() => setMoveTarget('')}>
                  / (root)
                </div>
                {existingFolders.map(f => (
                  <div key={f} className={`move-modal-suggestion${moveTarget === f ? ' active' : ''}`} onClick={() => setMoveTarget(f)}>
                    {f}
                  </div>
                ))}
              </div>
            )}
            <div className="move-modal-buttons">
              <button className="move-modal-cancel" onClick={() => setMovingDiagram(null)}>Cancel</button>
              <button className="move-modal-confirm" onClick={handleMove}>Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
