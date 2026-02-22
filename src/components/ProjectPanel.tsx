import React, { useState, useEffect, useCallback } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { API, setAuthToken } from '@/utils/api';
import type { DiagramMeta } from '@/types';

interface ProjectPanelProps {
  visible: boolean;
  onLoadDiagram: (id: string) => void;
  onNewDiagram: () => void;
}

export function ProjectPanel({ visible, onLoadDiagram, onNewDiagram }: ProjectPanelProps) {
  const { state } = useDiagram();
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([]);

  const loadList = useCallback(async () => {
    if (!state.authToken) return;
    try {
      const list = await API.list();
      setDiagrams(list);
    } catch (e) {
      console.error('Failed to load diagrams:', e);
    }
  }, [state.authToken]);

  useEffect(() => {
    if (visible && state.authToken) {
      loadList();
    }
  }, [visible, state.authToken, loadList]);

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

  if (!visible) return null;

  return (
    <div className="project-panel show" id="projectPanel">
      <div className="sidebar-title">Your Diagrams</div>
      <button className="project-new-btn" onClick={onNewDiagram}>+ New Diagram</button>
      <div id="projectList">
        {diagrams.map(d => (
          <div
            key={d._id}
            className={`project-item ${d._id === state.currentDiagramId ? 'active' : ''}`}
            onClick={() => onLoadDiagram(d._id)}
          >
            <div className="project-item-name">{d.name}</div>
            <div className="project-item-meta">
              {new Date(d.updatedAt).toLocaleDateString()}
            </div>
            <button
              className="project-item-delete"
              onClick={(e) => handleDelete(e, d._id)}
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
        {diagrams.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            No diagrams yet. Create one!
          </div>
        )}
      </div>
    </div>
  );
}
