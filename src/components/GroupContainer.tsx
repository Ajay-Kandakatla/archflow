import React, { useCallback, useRef } from 'react';
import type { GroupContainer } from '@/types';
import { useDiagram } from '@/store/DiagramContext';
import { screenToCanvas } from '@/utils/canvas';
import { computeSnap } from '@/utils/snap';

interface GroupContainerProps {
  group: GroupContainer;
  isSelected: boolean;
  isMultiSelected?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMultiDragStart?: (e: React.MouseEvent) => void;
}

export const GroupContainerComponent = React.memo(function GroupContainerComponent({
  group, isSelected, isMultiSelected, containerRef, onDragStart, onDragEnd, onMultiDragStart,
}: GroupContainerProps) {
  const { state, dispatch } = useDiagram();
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  // Keep refs to current pan/scale so drag handler always has fresh values
  const panScaleRef = useRef({ panX: state.panX, panY: state.panY, scale: state.scale });
  panScaleRef.current = { panX: state.panX, panY: state.panY, scale: state.scale };

  const childCount = (group.childNodeIds || []).length + (group.childNoteIds || []).length;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.group-container-resize') || target.closest('.group-container-delete') || target.closest('.group-container-ungroup') || target.tagName === 'INPUT') return;
    e.stopPropagation();

    // Ctrl+Click (or Cmd+Click) = toggle individual selection
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'TOGGLE_SELECT_GROUP', payload: group.id });
      return;
    }

    if (isMultiSelected && onMultiDragStart) {
      onMultiDragStart(e);
      return;
    }

    dispatch({ type: 'SELECT_GROUP', payload: group.id });

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { panX, panY, scale } = panScaleRef.current;
    const p = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, scale);
    dragRef.current = { dragging: true, offsetX: p.x - group.x, offsetY: p.y - group.y };
    onDragStart?.();

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const { panX: px, panY: py, scale: s } = panScaleRef.current;
      const pp = screenToCanvas(ev.clientX, ev.clientY, r, px, py, s);
      let newX = pp.x - dragRef.current.offsetX;
      let newY = pp.y - dragRef.current.offsetY;

      // Snap to alignment
      const snap = computeSnap(newX, newY, group.width, group.height, state.nodes, state.groups, null, group.id);
      if (snap.snapX !== null) newX = snap.snapX;
      if (snap.snapY !== null) newY = snap.snapY;

      dispatch({ type: 'MOVE_GROUP', payload: { id: group.id, x: newX, y: newY } });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      onDragEnd?.();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [group.id, group.x, group.y, state.nodes, state.groups, dispatch, containerRef, isMultiSelected, onMultiDragStart]);

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startW = group.width;
    const startH = group.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / state.scale;
      const dy = (ev.clientY - startY) / state.scale;
      dispatch({
        type: 'RESIZE_GROUP',
        payload: {
          id: group.id,
          width: Math.max(200, startW + dx),
          height: Math.max(150, startH + dy),
        },
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [group.id, group.width, group.height, state.scale, dispatch]);

  const handleUngroup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'UNGROUP', payload: group.id });
  }, [group.id, dispatch]);

  // Auto-detect nodes/notes inside the group bounds and add them as children
  const handleAutoGroup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const nodeIdsInside = state.nodes.filter(n => {
      const el = document.getElementById('node-' + n.id);
      const w = n.width || el?.offsetWidth || 170;
      const h = n.height || el?.offsetHeight || 90;
      return n.x >= group.x && n.y >= group.y && n.x + w <= group.x + group.width && n.y + h <= group.y + group.height;
    }).map(n => n.id);

    const noteIdsInside = state.stickyNotes.filter(n => {
      return n.x >= group.x && n.y >= group.y && n.x + (n.width || 200) <= group.x + group.width && n.y + (n.height || 150) <= group.y + group.height;
    }).map(n => n.id);

    if (nodeIdsInside.length > 0 || noteIdsInside.length > 0) {
      dispatch({ type: 'ADD_TO_GROUP', payload: { groupId: group.id, nodeIds: nodeIdsInside, noteIds: noteIdsInside } });
    }
  }, [group.id, group.x, group.y, group.width, group.height, state.nodes, state.stickyNotes, dispatch]);

  return (
    <div
      className={`group-container ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''}`}
      id={'group-' + group.id}
      data-color={group.color}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
      }}
      onMouseDown={handleMouseDown}
    >
      <input
        className="group-container-title"
        defaultValue={group.title}
        onChange={(e) => dispatch({ type: 'UPDATE_GROUP_TITLE', payload: { id: group.id, title: e.target.value } })}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="group-container-actions">
        {childCount > 0 ? (
          <button
            className="group-container-ungroup"
            onClick={handleUngroup}
            title="Ungroup: release all items"
          >
            ⊟ Ungroup
          </button>
        ) : (
          <button
            className="group-container-ungroup"
            onClick={handleAutoGroup}
            title="Group: capture all items inside this container"
          >
            ⊞ Group Items
          </button>
        )}
        <span className="group-child-count">{childCount > 0 ? `${childCount} items` : ''}</span>
      </div>
      <button
        className="group-container-delete"
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: 'DELETE_GROUP', payload: group.id });
        }}
      >
        ✕
      </button>
      <div className="group-container-resize" onMouseDown={handleResize} />
    </div>
  );
});
