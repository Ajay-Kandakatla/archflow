import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { DiagramNode, Connection, StickyNote, CanvasImage, GroupContainer, ToolMode, Theme, User, PortPosition, NodeColor, ConnectionRouting, TextFormatting, Waypoint, BorderStyle } from '@/types';
import { CT, CV, DEFAULT_DIMENSIONS } from './constants';

// Maximum undo history size
const MAX_UNDO_HISTORY = 50;

// State interface
interface DiagramState {
  nodes: DiagramNode[];
  connections: Connection[];
  stickyNotes: StickyNote[];
  canvasImages: CanvasImage[];
  groups: GroupContainer[];
  selectedNode: number | null;
  selectedGroup: number | null;
  selectedNodeIds: number[];
  selectedNoteIds: number[];
  selectedGroupIds: number[];
  selectedConnectionId: number | null;
  currentTool: ToolMode;
  scale: number;
  panX: number;
  panY: number;
  nodeIdCounter: number;
  connectionIdCounter: number;
  noteIdCounter: number;
  imageIdCounter: number;
  groupIdCounter: number;
  currentDiagramId: string | null;
  currentUser: User | null;
  authToken: string | null;
  theme: Theme;
  projectPanelOpen: boolean;
}

// Action types
type DiagramAction =
  | { type: 'ADD_NODE'; payload: { nodeType: string; x: number; y: number; iconSvg?: string; iconName?: string } }
  | { type: 'MOVE_NODE'; payload: { id: number; x: number; y: number } }
  | { type: 'RESIZE_NODE'; payload: { id: number; x: number; y: number; width: number; height: number } }
  | { type: 'UPDATE_NODE_TITLE'; payload: { id: number; title: string } }
  | { type: 'UPDATE_NODE_DESC'; payload: { id: number; desc: string } }
  | { type: 'DELETE_NODE'; payload: number }
  | { type: 'SELECT_NODE'; payload: number | null }
  | { type: 'ADD_CONNECTION'; payload: { from: number; fromType?: 'node' | 'note'; fromPort: PortPosition; to: number; toType?: 'node' | 'note'; toPort: PortPosition; label?: string } }
  | { type: 'DELETE_CONNECTION'; payload: number }
  | { type: 'CYCLE_CONNECTION_DIRECTION'; payload: number }
  | { type: 'TOGGLE_CONNECTION_ROUTING'; payload: number }
  | { type: 'CYCLE_CONNECTION_ROUTING'; payload: number }
  | { type: 'UPDATE_CONNECTION_LABEL'; payload: { id: number; label: string } }
  | { type: 'UPDATE_CONNECTION_MIDOFFSET'; payload: { id: number; midOffset: number } }
  | { type: 'UPDATE_CONNECTION_BEZIER_OFFSET'; payload: { id: number; bezierOffset: { dx: number; dy: number } } }
  | { type: 'UPDATE_CONNECTION_LABEL_OFFSET'; payload: { id: number; labelOffset: { dx: number; dy: number } } }
  | { type: 'ADD_NOTE'; payload: { color: string; x: number; y: number } }
  | { type: 'MOVE_NOTE'; payload: { id: number; x: number; y: number } }
  | { type: 'RESIZE_NOTE'; payload: { id: number; width: number; height: number } }
  | { type: 'UPDATE_NOTE_TEXT'; payload: { id: number; text: string } }
  | { type: 'DELETE_NOTE'; payload: number }
  | { type: 'ADD_IMAGE'; payload: { imageId: string; x: number; y: number } }
  | { type: 'MOVE_IMAGE'; payload: { id: number; x: number; y: number } }
  | { type: 'RESIZE_IMAGE'; payload: { id: number; width: number; height: number } }
  | { type: 'DELETE_IMAGE'; payload: number }
  | { type: 'SET_TOOL'; payload: ToolMode }
  | { type: 'SET_ZOOM'; payload: { scale: number; panX: number; panY: number } }
  | { type: 'SET_PAN'; payload: { panX: number; panY: number } }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_DIAGRAM_ID'; payload: string | null }
  | { type: 'TOGGLE_PROJECT_PANEL' }
  | { type: 'ADD_GROUP'; payload: { color: string; x: number; y: number } }
  | { type: 'MOVE_GROUP'; payload: { id: number; x: number; y: number } }
  | { type: 'RESIZE_GROUP'; payload: { id: number; width: number; height: number } }
  | { type: 'UPDATE_GROUP_TITLE'; payload: { id: number; title: string } }
  | { type: 'DELETE_GROUP'; payload: number }
  | { type: 'SELECT_GROUP'; payload: number | null }
  | { type: 'LOAD_DIAGRAM'; payload: { data: any; id: string; name: string } }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'SELECT_MULTIPLE'; payload: { nodeIds: number[]; noteIds: number[]; groupIds: number[] } }
  | { type: 'MOVE_SELECTED'; payload: { dx: number; dy: number } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_TO_GROUP'; payload: { groupId: number; nodeIds: number[]; noteIds: number[] } }
  | { type: 'REMOVE_FROM_GROUP'; payload: { groupId: number; nodeIds: number[]; noteIds: number[] } }
  | { type: 'GROUP_SELECTED' }
  | { type: 'UNGROUP'; payload: number }
  | { type: 'UNDO' }
  | { type: 'UPDATE_NODE_COLOR'; payload: { id: number; color: NodeColor } }
  | { type: 'UPDATE_NODE_BORDER_STYLE'; payload: { id: number; borderStyle: BorderStyle } }
  | { type: 'UPDATE_NODE_FORMAT'; payload: { id: number; field: 'titleFormat' | 'descFormat'; format: TextFormatting } }
  | { type: 'UPDATE_NOTE_FORMAT'; payload: { id: number; format: TextFormatting } }
  | { type: 'SELECT_CONNECTION'; payload: number | null }
  | { type: 'TOGGLE_SELECT_NODE'; payload: number }
  | { type: 'TOGGLE_SELECT_NOTE'; payload: number }
  | { type: 'TOGGLE_SELECT_GROUP'; payload: number }
  | { type: 'PASTE_ITEMS'; payload: { nodes: DiagramNode[]; notes: StickyNote[]; groups: GroupContainer[]; connections: Connection[]; offsetX: number; offsetY: number } }
  | { type: 'RECONNECT_CONNECTION'; payload: { id: number; end: 'from' | 'to'; newId: number; newType: 'node' | 'note'; newPort: PortPosition } }
  | { type: 'ADD_CONNECTION_WAYPOINT'; payload: { id: number; index: number; x: number; y: number } }
  | { type: 'UPDATE_CONNECTION_WAYPOINT'; payload: { id: number; index: number; x: number; y: number } }
  | { type: 'REMOVE_CONNECTION_WAYPOINT'; payload: { id: number; index: number } };

const initialState: DiagramState = {
  nodes: [],
  connections: [],
  stickyNotes: [],
  canvasImages: [],
  groups: [],
  selectedNode: null,
  selectedGroup: null,
  selectedNodeIds: [],
  selectedNoteIds: [],
  selectedGroupIds: [],
  selectedConnectionId: null,
  currentTool: 'select',
  scale: 1,
  panX: 0,
  panY: 0,
  nodeIdCounter: 0,
  connectionIdCounter: 0,
  noteIdCounter: 0,
  imageIdCounter: 0,
  groupIdCounter: 0,
  currentDiagramId: null,
  currentUser: null,
  authToken: null,
  theme: (localStorage.getItem('archflow-theme') as Theme) || 'dark',
  projectPanelOpen: false,
};

function diagramReducer(state: DiagramState, action: DiagramAction): DiagramState {
  switch (action.type) {
    case 'ADD_NODE': {
      const ct = CT[action.payload.nodeType];
      if (!ct) return state;
      const id = state.nodeIdCounter + 1;
      const dims = DEFAULT_DIMENSIONS[action.payload.nodeType];
      const node: DiagramNode = { id, type: action.payload.nodeType, x: action.payload.x, y: action.payload.y, ...ct, ...(dims ? { width: dims.width, height: dims.height } : {}), ...(action.payload.iconSvg ? { iconSvg: action.payload.iconSvg, iconName: action.payload.iconName, title: action.payload.iconName || 'Icon' } : {}) };
      return { ...state, nodes: [...state.nodes, node], nodeIdCounter: id };
    }
    case 'MOVE_NODE':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, x: action.payload.x, y: action.payload.y } : n) };
    case 'RESIZE_NODE':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, x: action.payload.x, y: action.payload.y, width: action.payload.width, height: action.payload.height } : n) };
    case 'UPDATE_NODE_TITLE':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, title: action.payload.title } : n) };
    case 'UPDATE_NODE_DESC':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, desc: action.payload.desc } : n) };
    case 'UPDATE_NODE_FORMAT':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, [action.payload.field]: { ...(n[action.payload.field] || {}), ...action.payload.format } } : n) };
    case 'UPDATE_NODE_COLOR':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, color: action.payload.color } : n) };
    case 'UPDATE_NODE_BORDER_STYLE':
      return { ...state, nodes: state.nodes.map(n => n.id === action.payload.id ? { ...n, borderStyle: action.payload.borderStyle } : n) };
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(n => n.id !== action.payload),
        connections: state.connections.filter(c => c.from !== action.payload && c.to !== action.payload),
        selectedNode: state.selectedNode === action.payload ? null : state.selectedNode,
        groups: state.groups.map(g => ({
          ...g,
          childNodeIds: (g.childNodeIds || []).filter(id => id !== action.payload),
        })),
      };
    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload, selectedNodeIds: action.payload !== null ? [action.payload] : [], selectedNoteIds: [], selectedGroupIds: [], selectedConnectionId: null };
    case 'SELECT_CONNECTION':
      return { ...state, selectedConnectionId: action.payload, selectedNode: null, selectedNodeIds: [], selectedNoteIds: [], selectedGroupIds: [], selectedGroup: null };
    case 'ADD_CONNECTION': {
      const id = state.connectionIdCounter + 1;
      const fromType = action.payload.fromType || 'node';
      const toType = action.payload.toType || 'node';
      // Determine color from the source endpoint
      let connColor: NodeColor = 'blue';
      if (fromType === 'node') {
        const fromNode = state.nodes.find(n => n.id === action.payload.from);
        if (fromNode) connColor = fromNode.color;
      }
      const conn: Connection = {
        id, from: action.payload.from, fromType, fromPort: action.payload.fromPort,
        to: action.payload.to, toType, toPort: action.payload.toPort,
        color: connColor, label: action.payload.label || 'data', direction: 'forward', routing: 'bezier',
      };
      return { ...state, connections: [...state.connections, conn], connectionIdCounter: id };
    }
    case 'DELETE_CONNECTION':
      return { ...state, connections: state.connections.filter(c => c.id !== action.payload) };
    case 'CYCLE_CONNECTION_DIRECTION': {
      const order: Connection['direction'][] = ['forward', 'bidirectional', 'none', 'forward'];
      return {
        ...state,
        connections: state.connections.map(c => {
          if (c.id !== action.payload) return c;
          const idx = order.indexOf(c.direction);
          return { ...c, direction: order[(idx + 1) % 3] };
        }),
      };
    }
    case 'TOGGLE_CONNECTION_ROUTING':
      return {
        ...state,
        connections: state.connections.map(c =>
          c.id === action.payload ? { ...c, routing: (c.routing || 'bezier') === 'bezier' ? 'orthogonal' as const : 'bezier' as const } : c
        ),
      };
    case 'CYCLE_CONNECTION_ROUTING': {
      const routingOrder: ConnectionRouting[] = ['bezier', 'orthogonal', 'straight'];
      return {
        ...state,
        connections: state.connections.map(c => {
          if (c.id !== action.payload) return c;
          const current = c.routing || 'bezier';
          const idx = routingOrder.indexOf(current);
          return { ...c, routing: routingOrder[(idx + 1) % routingOrder.length] };
        }),
      };
    }
    case 'UPDATE_CONNECTION_LABEL':
      return { ...state, connections: state.connections.map(c => c.id === action.payload.id ? { ...c, label: action.payload.label } : c) };
    case 'UPDATE_CONNECTION_MIDOFFSET':
      return { ...state, connections: state.connections.map(c => c.id === action.payload.id ? { ...c, midOffset: action.payload.midOffset } : c) };
    case 'UPDATE_CONNECTION_BEZIER_OFFSET':
      return { ...state, connections: state.connections.map(c => c.id === action.payload.id ? { ...c, bezierOffset: action.payload.bezierOffset } : c) };
    case 'UPDATE_CONNECTION_LABEL_OFFSET':
      return { ...state, connections: state.connections.map(c => c.id === action.payload.id ? { ...c, labelOffset: action.payload.labelOffset } : c) };
    case 'ADD_NOTE': {
      const id = state.noteIdCounter + 1;
      const note: StickyNote = { id, x: action.payload.x, y: action.payload.y, color: action.payload.color as any, text: 'Add your note here...', width: 200, height: 150 };
      return { ...state, stickyNotes: [...state.stickyNotes, note], noteIdCounter: id };
    }
    case 'MOVE_NOTE':
      return { ...state, stickyNotes: state.stickyNotes.map(n => n.id === action.payload.id ? { ...n, x: action.payload.x, y: action.payload.y } : n) };
    case 'RESIZE_NOTE':
      return { ...state, stickyNotes: state.stickyNotes.map(n => n.id === action.payload.id ? { ...n, width: action.payload.width, height: action.payload.height } : n) };
    case 'UPDATE_NOTE_TEXT':
      return { ...state, stickyNotes: state.stickyNotes.map(n => n.id === action.payload.id ? { ...n, text: action.payload.text } : n) };
    case 'UPDATE_NOTE_FORMAT':
      return { ...state, stickyNotes: state.stickyNotes.map(n => n.id === action.payload.id ? { ...n, textFormat: { ...(n.textFormat || {}), ...action.payload.format } } : n) };
    case 'DELETE_NOTE':
      return {
        ...state,
        stickyNotes: state.stickyNotes.filter(n => n.id !== action.payload),
        groups: state.groups.map(g => ({
          ...g,
          childNoteIds: (g.childNoteIds || []).filter(id => id !== action.payload),
        })),
      };
    case 'ADD_IMAGE': {
      const id = state.imageIdCounter + 1;
      const img: CanvasImage = { id, imageId: action.payload.imageId, x: action.payload.x, y: action.payload.y, width: 300, height: 200 };
      return { ...state, canvasImages: [...state.canvasImages, img], imageIdCounter: id };
    }
    case 'MOVE_IMAGE':
      return { ...state, canvasImages: state.canvasImages.map(i => i.id === action.payload.id ? { ...i, x: action.payload.x, y: action.payload.y } : i) };
    case 'RESIZE_IMAGE':
      return { ...state, canvasImages: state.canvasImages.map(i => i.id === action.payload.id ? { ...i, width: action.payload.width, height: action.payload.height } : i) };
    case 'DELETE_IMAGE':
      return { ...state, canvasImages: state.canvasImages.filter(i => i.id !== action.payload) };
    case 'SET_TOOL':
      return { ...state, currentTool: action.payload };
    case 'SET_ZOOM':
      return { ...state, scale: action.payload.scale, panX: action.payload.panX, panY: action.payload.panY };
    case 'SET_PAN':
      return { ...state, panX: action.payload.panX, panY: action.payload.panY };
    case 'SET_THEME': {
      document.body.setAttribute('data-theme', action.payload);
      localStorage.setItem('archflow-theme', action.payload);
      return { ...state, theme: action.payload };
    }
    case 'SET_USER':
      return { ...state, currentUser: action.payload.user, authToken: action.payload.token };
    case 'CLEAR_USER':
      return { ...state, currentUser: null, authToken: null };
    case 'SET_DIAGRAM_ID':
      return { ...state, currentDiagramId: action.payload };
    case 'TOGGLE_PROJECT_PANEL':
      return { ...state, projectPanelOpen: !state.projectPanelOpen };
    case 'ADD_GROUP': {
      const id = state.groupIdCounter + 1;
      const group: GroupContainer = {
        id, x: action.payload.x, y: action.payload.y,
        width: 400, height: 300,
        color: action.payload.color as any, title: 'Group',
        childNodeIds: [], childNoteIds: [],
      };
      return { ...state, groups: [...state.groups, group], groupIdCounter: id };
    }
    case 'MOVE_GROUP': {
      const grp = state.groups.find(g => g.id === action.payload.id);
      if (!grp) return state;
      const dx = action.payload.x - grp.x;
      const dy = action.payload.y - grp.y;
      const childNodeIds = grp.childNodeIds || [];
      const childNoteIds = grp.childNoteIds || [];

      // Also detect nodes/notes visually stacked inside the group bounds (not just registered children)
      const overlappingNodeIds = state.nodes
        .filter(n => !childNodeIds.includes(n.id))
        .filter(n => {
          const el = typeof document !== 'undefined' ? document.getElementById('node-' + n.id) : null;
          const w = n.width || el?.offsetWidth || 170;
          const h = n.height || el?.offsetHeight || 90;
          return n.x >= grp.x && n.y >= grp.y && n.x + w <= grp.x + grp.width && n.y + h <= grp.y + grp.height;
        })
        .map(n => n.id);
      const overlappingNoteIds = state.stickyNotes
        .filter(n => !childNoteIds.includes(n.id))
        .filter(n => {
          return n.x >= grp.x && n.y >= grp.y && n.x + (n.width || 200) <= grp.x + grp.width && n.y + (n.height || 150) <= grp.y + grp.height;
        })
        .map(n => n.id);

      const allNodeIds = [...childNodeIds, ...overlappingNodeIds];
      const allNoteIds = [...childNoteIds, ...overlappingNoteIds];

      return {
        ...state,
        groups: state.groups.map(g => g.id === action.payload.id ? { ...g, x: action.payload.x, y: action.payload.y } : g),
        nodes: allNodeIds.length > 0 ? state.nodes.map(n => allNodeIds.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n) : state.nodes,
        stickyNotes: allNoteIds.length > 0 ? state.stickyNotes.map(n => allNoteIds.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n) : state.stickyNotes,
      };
    }
    case 'RESIZE_GROUP':
      return { ...state, groups: state.groups.map(g => g.id === action.payload.id ? { ...g, width: action.payload.width, height: action.payload.height } : g) };
    case 'UPDATE_GROUP_TITLE':
      return { ...state, groups: state.groups.map(g => g.id === action.payload.id ? { ...g, title: action.payload.title } : g) };
    case 'DELETE_GROUP':
      return { ...state, groups: state.groups.filter(g => g.id !== action.payload), selectedGroup: state.selectedGroup === action.payload ? null : state.selectedGroup };
    case 'SELECT_GROUP':
      return { ...state, selectedGroup: action.payload, selectedGroupIds: action.payload !== null ? [action.payload] : [], selectedNodeIds: [], selectedNoteIds: [], selectedConnectionId: null };
    case 'LOAD_DIAGRAM': {
      const d = action.payload.data || {};
      return {
        ...state,
        nodes: d.nodes || [],
        connections: (d.connections || []).map((c: any) => ({ ...c, direction: c.direction || 'forward', routing: c.routing || 'bezier', fromType: c.fromType || 'node', toType: c.toType || 'node' })),
        stickyNotes: d.stickyNotes || [],
        canvasImages: d.canvasImages || [],
        groups: (d.groups || []).map((g: any) => ({ ...g, childNodeIds: g.childNodeIds || [], childNoteIds: g.childNoteIds || [] })),
        nodeIdCounter: d.nodeIdCounter || 0,
        connectionIdCounter: d.connectionIdCounter || 0,
        noteIdCounter: d.noteIdCounter || 0,
        imageIdCounter: d.imageIdCounter || 0,
        groupIdCounter: d.groupIdCounter || 0,
        currentDiagramId: action.payload.id,
        selectedNodeIds: [],
        selectedNoteIds: [],
        selectedGroupIds: [],
      };
    }
    case 'CLEAR_CANVAS':
      return { ...state, nodes: [], connections: [], stickyNotes: [], canvasImages: [], groups: [], nodeIdCounter: 0, connectionIdCounter: 0, noteIdCounter: 0, imageIdCounter: 0, groupIdCounter: 0, selectedNodeIds: [], selectedNoteIds: [], selectedGroupIds: [], panX: 0, panY: 0, scale: 1 };
    case 'SELECT_MULTIPLE':
      return {
        ...state,
        selectedNodeIds: action.payload.nodeIds,
        selectedNoteIds: action.payload.noteIds,
        selectedGroupIds: action.payload.groupIds,
        selectedNode: action.payload.nodeIds.length > 0 ? action.payload.nodeIds[0] : null,
        selectedGroup: action.payload.groupIds.length > 0 ? action.payload.groupIds[0] : null,
      };
    case 'MOVE_SELECTED':
      return {
        ...state,
        nodes: state.nodes.map(n =>
          state.selectedNodeIds.includes(n.id)
            ? { ...n, x: n.x + action.payload.dx, y: n.y + action.payload.dy }
            : n
        ),
        stickyNotes: state.stickyNotes.map(n =>
          state.selectedNoteIds.includes(n.id)
            ? { ...n, x: n.x + action.payload.dx, y: n.y + action.payload.dy }
            : n
        ),
        groups: state.groups.map(g =>
          state.selectedGroupIds.includes(g.id)
            ? { ...g, x: g.x + action.payload.dx, y: g.y + action.payload.dy }
            : g
        ),
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedNodeIds: [],
        selectedNoteIds: [],
        selectedGroupIds: [],
        selectedNode: null,
        selectedGroup: null,
        selectedConnectionId: null,
      };
    case 'ADD_TO_GROUP': {
      const { groupId, nodeIds, noteIds } = action.payload;
      return {
        ...state,
        groups: state.groups.map(g => {
          if (g.id !== groupId) return g;
          const existingNodeIds = g.childNodeIds || [];
          const existingNoteIds = g.childNoteIds || [];
          return {
            ...g,
            childNodeIds: [...existingNodeIds, ...nodeIds.filter(id => !existingNodeIds.includes(id))],
            childNoteIds: [...existingNoteIds, ...noteIds.filter(id => !existingNoteIds.includes(id))],
          };
        }),
      };
    }
    case 'REMOVE_FROM_GROUP': {
      const { groupId: gid, nodeIds: rnIds, noteIds: rnoteIds } = action.payload;
      return {
        ...state,
        groups: state.groups.map(g => {
          if (g.id !== gid) return g;
          return {
            ...g,
            childNodeIds: (g.childNodeIds || []).filter(id => !rnIds.includes(id)),
            childNoteIds: (g.childNoteIds || []).filter(id => !rnoteIds.includes(id)),
          };
        }),
      };
    }
    case 'GROUP_SELECTED': {
      // Create a new group that wraps all selected nodes and notes
      const selNodes = state.nodes.filter(n => state.selectedNodeIds.includes(n.id));
      const selNotes = state.stickyNotes.filter(n => state.selectedNoteIds.includes(n.id));
      if (selNodes.length === 0 && selNotes.length === 0) return state;

      // Compute bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selNodes.forEach(n => {
        const el = document.getElementById('node-' + n.id);
        const w = n.width || el?.offsetWidth || 170;
        const h = n.height || el?.offsetHeight || 90;
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + w);
        maxY = Math.max(maxY, n.y + h);
      });
      selNotes.forEach(n => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + (n.width || 200));
        maxY = Math.max(maxY, n.y + (n.height || 150));
      });

      const padding = 30;
      const id = state.groupIdCounter + 1;
      const newGroup: GroupContainer = {
        id,
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
        color: 'blue',
        title: 'Group',
        childNodeIds: state.selectedNodeIds,
        childNoteIds: state.selectedNoteIds,
      };
      return {
        ...state,
        groups: [...state.groups, newGroup],
        groupIdCounter: id,
        selectedGroup: id,
        selectedGroupIds: [id],
      };
    }
    case 'UNGROUP': {
      const grpToRemove = state.groups.find(g => g.id === action.payload);
      if (!grpToRemove) return state;
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== action.payload),
        selectedGroup: state.selectedGroup === action.payload ? null : state.selectedGroup,
        selectedGroupIds: state.selectedGroupIds.filter(id => id !== action.payload),
      };
    }
    case 'TOGGLE_SELECT_NODE': {
      const nodeId = action.payload;
      const isSelected = state.selectedNodeIds.includes(nodeId);
      const newNodeIds = isSelected
        ? state.selectedNodeIds.filter(id => id !== nodeId)
        : [...state.selectedNodeIds, nodeId];
      return {
        ...state,
        selectedNodeIds: newNodeIds,
        selectedNode: newNodeIds.length > 0 ? newNodeIds[newNodeIds.length - 1] : null,
        selectedConnectionId: null,
      };
    }
    case 'TOGGLE_SELECT_NOTE': {
      const noteId = action.payload;
      const isNoteSelected = state.selectedNoteIds.includes(noteId);
      const newNoteIds = isNoteSelected
        ? state.selectedNoteIds.filter(id => id !== noteId)
        : [...state.selectedNoteIds, noteId];
      return {
        ...state,
        selectedNoteIds: newNoteIds,
        selectedConnectionId: null,
      };
    }
    case 'TOGGLE_SELECT_GROUP': {
      const grpId = action.payload;
      const isGrpSelected = state.selectedGroupIds.includes(grpId);
      const newGroupIds = isGrpSelected
        ? state.selectedGroupIds.filter(id => id !== grpId)
        : [...state.selectedGroupIds, grpId];
      return {
        ...state,
        selectedGroupIds: newGroupIds,
        selectedGroup: newGroupIds.length > 0 ? newGroupIds[newGroupIds.length - 1] : null,
        selectedConnectionId: null,
      };
    }
    case 'PASTE_ITEMS': {
      const { nodes: srcNodes, notes: srcNotes, groups: srcGroups, connections: srcConns, offsetX, offsetY } = action.payload;
      // Build old-to-new ID maps
      let nid = state.nodeIdCounter;
      let ntid = state.noteIdCounter;
      let gid = state.groupIdCounter;
      let cid = state.connectionIdCounter;
      const nodeIdMap: Record<number, number> = {};
      const noteIdMap: Record<number, number> = {};
      const groupIdMap: Record<number, number> = {};

      const newNodes = srcNodes.map(n => {
        nid++;
        nodeIdMap[n.id] = nid;
        return { ...n, id: nid, x: n.x + offsetX, y: n.y + offsetY };
      });
      const newNotes = srcNotes.map(n => {
        ntid++;
        noteIdMap[n.id] = ntid;
        return { ...n, id: ntid, x: n.x + offsetX, y: n.y + offsetY };
      });
      const newGroups = srcGroups.map(g => {
        gid++;
        groupIdMap[g.id] = gid;
        return {
          ...g, id: gid, x: g.x + offsetX, y: g.y + offsetY,
          childNodeIds: g.childNodeIds.map((id: number) => nodeIdMap[id] || id),
          childNoteIds: g.childNoteIds.map((id: number) => noteIdMap[id] || id),
        };
      });
      // Re-map connections between copied items
      const newConns = srcConns
        .filter(c => nodeIdMap[c.from] !== undefined && nodeIdMap[c.to] !== undefined)
        .map(c => {
          cid++;
          return {
            ...c, id: cid, from: nodeIdMap[c.from], to: nodeIdMap[c.to],
            waypoints: c.waypoints?.map((w: Waypoint) => ({ x: w.x + offsetX, y: w.y + offsetY })),
          };
        });

      return {
        ...state,
        nodes: [...state.nodes, ...newNodes],
        stickyNotes: [...state.stickyNotes, ...newNotes],
        groups: [...state.groups, ...newGroups],
        connections: [...state.connections, ...newConns],
        nodeIdCounter: nid,
        noteIdCounter: ntid,
        groupIdCounter: gid,
        connectionIdCounter: cid,
        selectedNodeIds: newNodes.map(n => n.id),
        selectedNoteIds: newNotes.map(n => n.id),
        selectedGroupIds: newGroups.map(g => g.id),
        selectedNode: newNodes.length > 0 ? newNodes[0].id : null,
        selectedGroup: newGroups.length > 0 ? newGroups[0].id : null,
      };
    }
    case 'RECONNECT_CONNECTION': {
      const { id, end, newId, newType, newPort } = action.payload;
      return {
        ...state,
        connections: state.connections.map(c => {
          if (c.id !== id) return c;
          if (end === 'from') {
            let newColor: NodeColor = c.color;
            if (newType === 'node') {
              const node = state.nodes.find(n => n.id === newId);
              if (node) newColor = node.color;
            }
            return { ...c, from: newId, fromType: newType, fromPort: newPort, color: newColor };
          } else {
            return { ...c, to: newId, toType: newType, toPort: newPort };
          }
        }),
      };
    }
    case 'ADD_CONNECTION_WAYPOINT': {
      const { id, index, x, y } = action.payload;
      return {
        ...state,
        connections: state.connections.map(c => {
          if (c.id !== id) return c;
          const wps = [...(c.waypoints || [])];
          wps.splice(index, 0, { x, y });
          return { ...c, waypoints: wps };
        }),
      };
    }
    case 'UPDATE_CONNECTION_WAYPOINT': {
      const { id, index, x, y } = action.payload;
      return {
        ...state,
        connections: state.connections.map(c => {
          if (c.id !== id) return c;
          const wps = [...(c.waypoints || [])];
          if (index >= 0 && index < wps.length) {
            wps[index] = { x, y };
          }
          return { ...c, waypoints: wps };
        }),
      };
    }
    case 'REMOVE_CONNECTION_WAYPOINT': {
      const { id, index } = action.payload;
      return {
        ...state,
        connections: state.connections.map(c => {
          if (c.id !== id) return c;
          const wps = [...(c.waypoints || [])];
          wps.splice(index, 1);
          return { ...c, waypoints: wps.length > 0 ? wps : undefined };
        }),
      };
    }
    default:
      return state;
  }
}

interface DiagramContextValue {
  state: DiagramState;
  dispatch: React.Dispatch<DiagramAction>;
}

const DiagramContext = createContext<DiagramContextValue | null>(null);

// Actions that should NOT be saved in undo history (UI-only or high-frequency)
const NON_UNDOABLE_ACTIONS = new Set([
  'SET_TOOL', 'SET_ZOOM', 'SET_PAN', 'SET_THEME', 'SET_USER', 'CLEAR_USER',
  'SET_DIAGRAM_ID', 'TOGGLE_PROJECT_PANEL', 'SELECT_NODE', 'SELECT_GROUP', 'SELECT_CONNECTION',
  'SELECT_MULTIPLE', 'CLEAR_SELECTION', 'UNDO', 'MOVE_NODE', 'MOVE_NOTE',
  'MOVE_GROUP', 'MOVE_SELECTED', 'MOVE_IMAGE', 'RESIZE_NOTE', 'RESIZE_GROUP',
  'RESIZE_NODE', 'RESIZE_IMAGE', 'UPDATE_CONNECTION_MIDOFFSET', 'UPDATE_CONNECTION_BEZIER_OFFSET', 'UPDATE_CONNECTION_LABEL_OFFSET', 'UPDATE_CONNECTION_WAYPOINT',
  'TOGGLE_SELECT_NODE', 'TOGGLE_SELECT_NOTE', 'TOGGLE_SELECT_GROUP',
]);

export function DiagramProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(diagramReducer, initialState);
  const undoStackRef = useRef<DiagramState[]>([]);
  const lastSnapshotRef = useRef<DiagramState | null>(null);

  // Wrap dispatch to capture undo snapshots
  const dispatch = useCallback((action: DiagramAction) => {
    if (action.type === 'UNDO') {
      const stack = undoStackRef.current;
      if (stack.length > 0) {
        const prev = stack.pop()!;
        // Restore diagram data while preserving UI state
        rawDispatch({ type: 'LOAD_DIAGRAM', payload: {
          data: {
            nodes: prev.nodes,
            connections: prev.connections,
            stickyNotes: prev.stickyNotes,
            canvasImages: prev.canvasImages,
            groups: prev.groups,
            nodeIdCounter: prev.nodeIdCounter,
            connectionIdCounter: prev.connectionIdCounter,
            noteIdCounter: prev.noteIdCounter,
            imageIdCounter: prev.imageIdCounter,
            groupIdCounter: prev.groupIdCounter,
          },
          id: prev.currentDiagramId || '',
          name: '',
        }});
      }
      return;
    }

    if (!NON_UNDOABLE_ACTIONS.has(action.type)) {
      // Save current state before making the change
      if (lastSnapshotRef.current) {
        undoStackRef.current.push(lastSnapshotRef.current);
        if (undoStackRef.current.length > MAX_UNDO_HISTORY) {
          undoStackRef.current.shift();
        }
      }
    }

    rawDispatch(action);
  }, [rawDispatch]);

  // Keep lastSnapshotRef in sync after every render
  useEffect(() => {
    lastSnapshotRef.current = state;
  });

  // Apply theme on mount
  useEffect(() => {
    document.body.setAttribute('data-theme', state.theme);
  }, []);

  return (
    <DiagramContext.Provider value={{ state, dispatch }}>
      {children}
    </DiagramContext.Provider>
  );
}

export function useDiagram() {
  const ctx = useContext(DiagramContext);
  if (!ctx) throw new Error('useDiagram must be used within DiagramProvider');
  return ctx;
}

export function useDiagramState() {
  return useDiagram().state;
}

export function useDiagramDispatch() {
  return useDiagram().dispatch;
}
