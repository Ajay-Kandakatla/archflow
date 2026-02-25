import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DiagramProvider, useDiagram } from '@/store/DiagramContext';
import { Topbar } from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { NodeComponent } from '@/components/Node';
import { StickyNoteComponent } from '@/components/StickyNoteComponent';
import { ConnectionsSvg } from '@/components/ConnectionsSvg';
import { CanvasImageComponent } from '@/components/CanvasImage';
import { GroupContainerComponent } from '@/components/GroupContainer';
import { MarqueeSelection } from '@/components/MarqueeSelection';
import { Minimap } from '@/components/Minimap';
import { TemplateModal } from '@/components/TemplateModal';
import { ContextMenu } from '@/components/ContextMenu';
import { ProjectPanel } from '@/components/ProjectPanel';
import { AdminOverlay } from '@/components/AdminOverlay';
import { HintOverlay } from '@/components/HintOverlay';
import { LoginOverlay } from '@/components/LoginOverlay';
import { DocsPage } from '@/components/DocsPage';
import { DevDocsPage } from '@/components/DevDocsPage';
import { AlignmentGuides } from '@/components/AlignmentGuides';
import { AiPromptPanel } from '@/components/AiPromptPanel';
import { TextToolbar } from '@/components/TextToolbar';
import { Toast, showToast } from '@/components/Toast';
import { ShareModal } from '@/components/ShareModal';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useAutoSave, loadLocalDiagram } from '@/hooks/useAutoSave';
import { API, setAuthToken } from '@/utils/api';
import { getTemplateData, TEMPLATE_NAMES } from '@/utils/templates';
import { screenToCanvas } from '@/utils/canvas';
import { getValidTargetPorts, findNearestSnapPort, isDuplicateConnection, type TargetPort } from '@/utils/connectionSnap';
import type { PortPosition, ToolMode, DiagramData } from '@/types';

function AppInner() {
  const { state, dispatch } = useDiagram();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Local UI state
  const [diagramName, setDiagramName] = useState('Untitled Diagram');
  const [templateVisible, setTemplateVisible] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminVisible, setAdminVisible] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [devLoginEnabled, setDevLoginEnabled] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<string | null>(null);
  const [aiPanelVisible, setAiPanelVisible] = useState(false);
  const [shareRole, setShareRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);
  const [shareAccessDenied, setShareAccessDenied] = useState(false);
  const isReadOnly = shareRole === 'viewer';

  // Dragging state (for alignment guides)
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [draggingGroupId, setDraggingGroupId] = useState<number | null>(null);

  // Marquee selection state
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Multi-drag ref
  const multiDragRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({ dragging: false, lastX: 0, lastY: 0 });

  // Stacking offset for click-to-place (so multiple clicks don't overlap)
  const placeOffsetRef = useRef(0);

  // Clipboard for copy/paste
  const clipboardRef = useRef<{ nodes: any[]; notes: any[]; groups: any[]; connections: any[] } | null>(null);
  const pasteCountRef = useRef(0);

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState({ visible: false, x: 0, y: 0, canvasX: 0, canvasY: 0 });

  // Connection drawing state
  const connRef = useRef<{ drawing: boolean; fromId: number; fromType: 'node' | 'note'; fromPort: PortPosition; startPos: { x: number; y: number } }>({
    drawing: false, fromId: 0, fromType: 'node', fromPort: 'bottom', startPos: { x: 0, y: 0 },
  });
  const [tempConn, setTempConn] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [highlightedPorts, setHighlightedPorts] = useState<Set<string>>(new Set());
  const [snapTarget, setSnapTarget] = useState<{ id: number; type: string; port: string } | null>(null);
  const snapTargetRef = useRef<{ id: number; type: string; port: string } | null>(null);
  const validPortsRef = useRef<TargetPort[]>([]);

  // Load Google client ID on mount
  useEffect(() => {
    API.getConfig().then(cfg => {
      if (cfg.googleClientId) setGoogleClientId(cfg.googleClientId);
      if (cfg.devLoginEnabled) setDevLoginEnabled(true);
    }).catch(() => {});
  }, []);

  // Restore saved auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('archflow-user');
    const savedToken = localStorage.getItem('archflow-token');
    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        setAuthToken(savedToken);
        dispatch({ type: 'SET_USER', payload: { user, token: savedToken } });
      } catch (e) {
        localStorage.removeItem('archflow-user');
        localStorage.removeItem('archflow-token');
      }
    }
  }, [dispatch]);

  // Track if we need to center after load
  const needsCenterRef = useRef(false);

  // Load shared diagram from /s/{shareToken} URL
  useEffect(() => {
    const path = window.location.pathname;
    if (!path.startsWith('/s/')) return;
    const shareToken = path.slice(3);
    if (!shareToken) return;
    API.getShared(shareToken).then(doc => {
      dispatch({ type: 'LOAD_DIAGRAM', payload: { data: doc.data, id: doc._id, name: doc.name } });
      setDiagramName(doc.name);
      setShareRole(doc.role as 'owner' | 'editor' | 'viewer');
      setShareAccessDenied(false);
      needsCenterRef.current = true;
    }).catch((err: any) => {
      if (err?.status === 403) {
        setShareAccessDenied(true);
      } else {
        showToast('Shared diagram not found');
      }
      setShareRole(null);
    });
  }, [dispatch]);

  // Load diagram from URL on auth, or from localStorage
  useEffect(() => {
    if (window.location.pathname.startsWith('/s/')) return; // skip for shared URLs
    if (window.location.pathname === '/docs') return; // skip for docs page
    if (window.location.pathname === '/dev-docs') return; // skip for dev-docs page
    const params = new URLSearchParams(window.location.search);
    const did = params.get('d');
    // Guard against invalid IDs like 'undefined' or 'null' in URL
    const isValidId = (id: string | null): id is string => !!id && id !== 'undefined' && id !== 'null';
    if (isValidId(did) && state.authToken) {
      API.get(did).then(doc => {
        dispatch({ type: 'LOAD_DIAGRAM', payload: { data: doc.data, id: doc._id, name: doc.name } });
        setDiagramName(doc.name);
        setShareRole(doc.role || null);
        setShareAccessDenied(false);
        needsCenterRef.current = true;
      }).catch((err: any) => {
        if (err?.status === 403) {
          showToast('Access denied');
        }
        // Invalid/unavailable diagram ID in URL — clean it up
        history.replaceState(null, '', '/');
        setShareRole(null);
      });
    } else if (did && !isValidId(did)) {
      // Clean up invalid ?d= param from URL
      history.replaceState(null, '', '/');
      setShareRole(null);
    } else if (state.nodes.length === 0) {
      // No server diagram — try loading from localStorage
      const localData = loadLocalDiagram();
      if (localData && (localData.nodes?.length > 0 || localData.stickyNotes?.length > 0 || localData.groups?.length > 0)) {
        const savedDiagramId = localStorage.getItem('archflow-diagramId') || '';
        const validSavedId = isValidId(savedDiagramId) ? savedDiagramId : '';
        dispatch({ type: 'LOAD_DIAGRAM', payload: { data: localData, id: validSavedId, name: 'Untitled Diagram' } });
        setShareRole(null);
        if (validSavedId) {
          history.replaceState(null, '', '/?d=' + validSavedId);
        }
        needsCenterRef.current = true;
      }
    }
  }, [state.authToken, dispatch]);

  // NOTE: auto-center and fit-screen effects moved after handleFitToScreen definition

  // Auto-save
  const autoSaveData: DiagramData = {
    nodes: state.nodes,
    connections: state.connections,
    stickyNotes: state.stickyNotes,
    canvasImages: state.canvasImages,
    groups: state.groups,
    nodeIdCounter: state.nodeIdCounter,
    connectionIdCounter: state.connectionIdCounter,
    noteIdCounter: state.noteIdCounter,
    imageIdCounter: state.imageIdCounter,
    groupIdCounter: state.groupIdCounter,
  };
  useAutoSave({
    diagramId: state.currentDiagramId,
    authToken: state.authToken,
    data: autoSaveData,
    enabled: !!state.currentDiagramId && !!state.authToken && !isReadOnly,
  });

  // Google auth callback
  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      const result = await API.authGoogle(response.credential);
      setAuthToken(result.token);
      localStorage.setItem('archflow-user', JSON.stringify(result.user));
      localStorage.setItem('archflow-token', result.token);
      dispatch({ type: 'SET_USER', payload: { user: result.user, token: result.token } });
      showToast('Signed in as ' + result.user.name);
    } catch (e) {
      showToast('Sign in failed');
    }
  }, [dispatch]);

  // Sign out
  const handleSignOut = useCallback(() => {
    localStorage.removeItem('archflow-user');
    localStorage.removeItem('archflow-token');
    setAuthToken(null);
    dispatch({ type: 'CLEAR_USER' });
    setUserMenuOpen(false);
    showToast('Signed out');
  }, [dispatch]);

  // Theme toggle
  const handleToggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  }, [state.theme, dispatch]);

  // Save
  const handleSave = useCallback(async () => {
    if (!state.authToken) {
      showToast('Sign in first to save');
      return;
    }
    try {
      if (state.currentDiagramId) {
        // Update existing diagram
        await API.update(state.currentDiagramId, { name: diagramName, data: autoSaveData });
        history.replaceState(null, '', '/?d=' + state.currentDiagramId);
        localStorage.setItem('archflow-diagramId', state.currentDiagramId);
      } else {
        // Create new diagram on server
        const result = await API.create(diagramName, autoSaveData);
        dispatch({ type: 'SET_DIAGRAM_ID', payload: result._id });
        history.replaceState(null, '', '/?d=' + result._id);
        localStorage.setItem('archflow-diagramId', result._id);
      }
      showToast('Saved!');
    } catch (e) {
      showToast('Save failed');
    }
  }, [state.currentDiagramId, state.authToken, diagramName, autoSaveData, dispatch]);

  // Share/Export modal
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const handleExport = useCallback(async () => {
    // Auto-save if not saved yet, so sharing works immediately
    if (!state.currentDiagramId && state.authToken) {
      try {
        const result = await API.create(diagramName, autoSaveData);
        dispatch({ type: 'SET_DIAGRAM_ID', payload: result._id });
        history.replaceState(null, '', '/?d=' + result._id);
        localStorage.setItem('archflow-diagramId', result._id);
      } catch (e) {
        showToast('Save failed');
      }
    }
    setShareModalVisible(true);
  }, [state.currentDiagramId, state.authToken, diagramName, autoSaveData, dispatch]);

  // Rename diagram — handled via inline editing in Topbar
  const handleRenameDiagram = useCallback((newName?: string) => {
    if (newName && newName.trim()) {
      setDiagramName(newName.trim());
      if (state.currentDiagramId && state.authToken) {
        API.update(state.currentDiagramId, { name: newName.trim() }).catch(() => {});
      }
    }
  }, [state.currentDiagramId, state.authToken]);

  // Template load
  const handleLoadTemplate = useCallback(async (name: string) => {
    setTemplateVisible(false);
    setShareRole(null);
    const data = getTemplateData(name);
    if (!data) return;

    const templateName = TEMPLATE_NAMES[name] || 'Untitled Diagram';

    if (state.authToken) {
      try {
        const result = await API.create(templateName, data);
        dispatch({ type: 'SET_DIAGRAM_ID', payload: result._id });
        history.replaceState(null, '', '/?d=' + result._id);
      } catch (e) {
        console.error('Failed to create:', e);
      }
    }

    if (name === 'blank') {
      dispatch({ type: 'CLEAR_CANVAS' });
    } else {
      dispatch({
        type: 'LOAD_DIAGRAM',
        payload: { data, id: state.currentDiagramId || '', name: templateName },
      });
      needsCenterRef.current = true;
    }
    setDiagramName(templateName);
  }, [state.authToken, state.currentDiagramId, dispatch]);

  // Load diagram by ID
  const handleLoadDiagram = useCallback(async (id: string, roleOverride?: 'owner' | 'editor' | 'viewer') => {
    try {
      const doc = await API.get(id);
      dispatch({ type: 'LOAD_DIAGRAM', payload: { data: doc.data, id: doc._id, name: doc.name } });
      setDiagramName(doc.name);
      setShareRole(roleOverride || doc.role || null);
      setShareAccessDenied(false);
      history.replaceState(null, '', '/?d=' + doc._id);
      dispatch({ type: 'TOGGLE_PROJECT_PANEL' });
    } catch (e) {
      showToast('Failed to load diagram');
    }
  }, [dispatch]);

  // New diagram
  const handleNewDiagram = useCallback(async (folder?: string) => {
    if (!state.authToken) return;
    try {
      const result = await API.create('Untitled Diagram', {}, folder);
      dispatch({ type: 'CLEAR_CANVAS' });
      dispatch({ type: 'SET_DIAGRAM_ID', payload: result._id });
      setDiagramName('Untitled Diagram');
      setShareRole(null);
      setShareAccessDenied(false);
      history.replaceState(null, '', '/?d=' + result._id);
      dispatch({ type: 'TOGGLE_PROJECT_PANEL' });
    } catch (e) {
      showToast('Failed to create diagram');
    }
  }, [state.authToken, dispatch]);

  // Click sidebar item to place at viewport center (with stacking offset)
  const handleClickAddNode = useCallback((type: string, extra?: { iconSvg?: string; iconName?: string }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (rect.width / 2 - state.panX) / state.scale;
    const cy = (rect.height / 2 - state.panY) / state.scale;
    const offset = placeOffsetRef.current * 24;
    placeOffsetRef.current = (placeOffsetRef.current + 1) % 8; // cycle 0-7

    // Handle note types (note-yellow, note-blue, etc.)
    if (type.startsWith('note-')) {
      const color = type.replace('note-', '');
      dispatch({ type: 'ADD_NOTE', payload: { color, x: cx - 100 + offset, y: cy - 75 + offset } });
      return;
    }

    dispatch({ type: 'ADD_NODE', payload: { nodeType: type, x: cx - 85 + offset, y: cy - 45 + offset, ...extra } });
  }, [state.panX, state.panY, state.scale, dispatch]);

  const handleClickAddGroup = useCallback((color: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (rect.width / 2 - state.panX) / state.scale;
    const cy = (rect.height / 2 - state.panY) / state.scale;
    const offset = placeOffsetRef.current * 24;
    placeOffsetRef.current = (placeOffsetRef.current + 1) % 8;
    dispatch({ type: 'ADD_GROUP', payload: { color, x: cx - 200 + offset, y: cy - 150 + offset } });
  }, [state.panX, state.panY, state.scale, dispatch]);

  // Drop node on canvas
  const handleDropNode = useCallback((type: string, x: number, y: number) => {
    dispatch({ type: 'ADD_NODE', payload: { nodeType: type, x, y } });
  }, [dispatch]);

  // Drop group on canvas
  const handleDropGroup = useCallback((color: string, x: number, y: number) => {
    dispatch({ type: 'ADD_GROUP', payload: { color, x, y } });
  }, [dispatch]);

  // Canvas click (for note tool)
  const handleCanvasClick = useCallback((x: number, y: number) => {
    // Close sidebar panel when clicking on canvas
    setSidebarTab(null);
    if (state.currentTool === 'note') {
      dispatch({ type: 'ADD_NOTE', payload: { color: 'yellow', x, y } });
      dispatch({ type: 'SET_TOOL', payload: 'select' });
    } else {
      dispatch({ type: 'SELECT_NODE', payload: null });
    }
  }, [state.currentTool, dispatch]);

  // Context menu
  const handleContextMenu = useCallback((screenX: number, screenY: number, canvasX: number, canvasY: number) => {
    setCtxMenu({ visible: true, x: screenX, y: screenY, canvasX, canvasY });
  }, []);

  const handleCtxAddNote = useCallback((color: string) => {
    dispatch({ type: 'ADD_NOTE', payload: { color, x: ctxMenu.canvasX, y: ctxMenu.canvasY } });
  }, [ctxMenu.canvasX, ctxMenu.canvasY, dispatch]);

  // Compute bounding box of all objects on canvas
  const computeCanvasBounds = useCallback(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasItems = false;
    state.nodes.forEach(n => {
      hasItems = true;
      const el = document.getElementById('node-' + n.id);
      const w = el?.offsetWidth || 180;
      const h = el?.offsetHeight || 100;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w);
      maxY = Math.max(maxY, n.y + h);
    });
    state.stickyNotes.forEach(n => {
      hasItems = true;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 200));
      maxY = Math.max(maxY, n.y + (n.height || 150));
    });
    state.groups.forEach(g => {
      hasItems = true;
      minX = Math.min(minX, g.x);
      minY = Math.min(minY, g.y);
      maxX = Math.max(maxX, g.x + g.width);
      maxY = Math.max(maxY, g.y + g.height);
    });
    return hasItems ? { minX, minY, maxX, maxY } : null;
  }, [state.nodes, state.stickyNotes, state.groups]);

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    const bounds = computeCanvasBounds();
    if (!bounds) return;
    const { minX, minY, maxX, maxY } = bounds;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cW = maxX - minX + 100;
    const cH = maxY - minY + 100;
    const newScale = Math.min(r.width / cW, r.height / cH, 1.5);
    const newPanX = (r.width - cW * newScale) / 2 - minX * newScale + 50 * newScale;
    const newPanY = (r.height - cH * newScale) / 2 - minY * newScale + 50 * newScale;
    dispatch({ type: 'SET_ZOOM', payload: { scale: newScale, panX: newPanX, panY: newPanY } });
  }, [computeCanvasBounds, dispatch]);

  // Auto-center view after diagram loads
  useEffect(() => {
    if (needsCenterRef.current && state.nodes.length > 0) {
      needsCenterRef.current = false;
      setTimeout(() => handleFitToScreen(), 100);
    }
  }, [state.nodes.length, handleFitToScreen]);

  // Listen for fit-screen event from AI panel
  useEffect(() => {
    const handler = () => setTimeout(() => handleFitToScreen(), 100);
    window.addEventListener('archflow-fit-screen', handler);
    return () => window.removeEventListener('archflow-fit-screen', handler);
  }, [handleFitToScreen]);

  // Keyboard shortcuts: Ctrl+Z (undo), Delete/Backspace (delete selected)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in input fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      // Ctrl+Z / Cmd+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      // Delete or Backspace = delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // Delete selected nodes
        if (state.selectedNodeIds.length > 0) {
          state.selectedNodeIds.forEach(id => dispatch({ type: 'DELETE_NODE', payload: id }));
        }
        // Delete selected notes
        if (state.selectedNoteIds.length > 0) {
          state.selectedNoteIds.forEach(id => dispatch({ type: 'DELETE_NOTE', payload: id }));
        }
        // Delete selected groups
        if (state.selectedGroupIds.length > 0) {
          state.selectedGroupIds.forEach(id => dispatch({ type: 'DELETE_GROUP', payload: id }));
        }
        // If a single node is selected via selectedNode
        if (state.selectedNode && state.selectedNodeIds.length === 0) {
          dispatch({ type: 'DELETE_NODE', payload: state.selectedNode });
        }
        // If a single group is selected via selectedGroup
        if (state.selectedGroup && state.selectedGroupIds.length === 0) {
          dispatch({ type: 'DELETE_GROUP', payload: state.selectedGroup });
        }
        // Delete selected connection
        if (state.selectedConnectionId) {
          dispatch({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
        }
      }

      // Escape = deselect all
      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_SELECTION' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, state.selectedNodeIds, state.selectedNoteIds, state.selectedGroupIds, state.selectedNode, state.selectedGroup, state.selectedConnectionId]);

  // Port drag (connection drawing) — supports both nodes and sticky notes
  const handlePortDragStart = useCallback((endpointId: number, port: PortPosition, startPos: { x: number; y: number }, endpointType: 'node' | 'note' = 'node') => {
    if (state.currentTool !== 'connect') {
      dispatch({ type: 'SET_TOOL', payload: 'connect' });
    }
    connRef.current = { drawing: true, fromId: endpointId, fromType: endpointType, fromPort: port, startPos };
    setTempConn({ x1: startPos.x, y1: startPos.y, x2: startPos.x, y2: startPos.y });

    // Pre-compute valid target ports once at drag start
    validPortsRef.current = getValidTargetPorts(state.nodes, state.stickyNotes, endpointId, endpointType);

    const onMove = (ev: MouseEvent) => {
      if (!connRef.current.drawing || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const p = screenToCanvas(ev.clientX, ev.clientY, r, state.panX, state.panY, state.scale);

      // Find snap target and highlighted ports
      const { snapPort, highlightedKeys } = findNearestSnapPort(p.x, p.y, validPortsRef.current);

      // If snapped, override the endpoint position
      const endX = snapPort ? snapPort.position.x : p.x;
      const endY = snapPort ? snapPort.position.y : p.y;

      setTempConn({ x1: startPos.x, y1: startPos.y, x2: endX, y2: endY });
      setHighlightedPorts(highlightedKeys);
      const snapInfo = snapPort ? { id: snapPort.id, type: snapPort.type, port: snapPort.port } : null;
      setSnapTarget(snapInfo);
      snapTargetRef.current = snapInfo;
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setTempConn(null);
      setHighlightedPorts(new Set());
      const currentSnap = snapTargetRef.current;
      setSnapTarget(null);
      snapTargetRef.current = null;
      validPortsRef.current = [];

      if (!connRef.current.drawing) return;
      connRef.current.drawing = false;

      // Try snap target first (more reliable), fall back to elementFromPoint
      let toId: number;
      let toType: 'node' | 'note';
      let toPort: PortPosition;

      if (currentSnap) {
        toId = currentSnap.id;
        toType = currentSnap.type as 'node' | 'note';
        toPort = currentSnap.port as PortPosition;
      } else {
        // Fall back to DOM-based detection
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        if (!target) return;
        const portEl = target.closest('.node-port') as HTMLElement;
        if (!portEl) return;
        toPort = portEl.dataset.port as PortPosition;

        const nodeEl = portEl.closest('.node') as HTMLElement;
        const noteEl = portEl.closest('.sticky-note') as HTMLElement;
        if (nodeEl) {
          toId = parseInt(nodeEl.id.replace('node-', ''));
          toType = 'node';
        } else if (noteEl) {
          toId = parseInt(noteEl.id.replace('note-', ''));
          toType = 'note';
        } else {
          return;
        }
      }

      // Can't connect to self
      if (toId === endpointId && toType === endpointType) return;

      // Prevent duplicate connections
      if (isDuplicateConnection(endpointId, endpointType, port, toId, toType, toPort, state.connections)) return;

      dispatch({
        type: 'ADD_CONNECTION',
        payload: { from: endpointId, fromType: endpointType, fromPort: port, to: toId, toType, toPort, label: 'data' },
      });
      dispatch({ type: 'SET_TOOL', payload: 'select' });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [state.currentTool, state.panX, state.panY, state.scale, state.nodes, state.stickyNotes, state.connections, dispatch]);

  // Delete all selected items (nodes, notes, groups, connection)
  const handleDelete = useCallback(() => {
    // Delete selected connection
    if (state.selectedConnectionId !== null) {
      dispatch({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
    }
    // Delete selected nodes
    state.selectedNodeIds.forEach(id => {
      dispatch({ type: 'DELETE_NODE', payload: id });
    });
    // Delete selected notes
    state.selectedNoteIds.forEach(id => {
      dispatch({ type: 'DELETE_NOTE', payload: id });
    });
    // Delete selected groups
    state.selectedGroupIds.forEach(id => {
      dispatch({ type: 'DELETE_GROUP', payload: id });
    });
  }, [state.selectedNodeIds, state.selectedNoteIds, state.selectedGroupIds, state.selectedConnectionId, dispatch]);

  // Select all — selects all nodes, notes, and groups
  const handleSelectAll = useCallback(() => {
    const nodeIds = state.nodes.map(n => n.id);
    const noteIds = state.stickyNotes.map(n => n.id);
    const groupIds = state.groups.map(g => g.id);
    if (nodeIds.length > 0 || noteIds.length > 0 || groupIds.length > 0) {
      dispatch({ type: 'SELECT_MULTIPLE', payload: { nodeIds, noteIds, groupIds } });
    }
  }, [state.nodes, state.stickyNotes, state.groups, dispatch]);

  // Copy selected items
  const handleCopy = useCallback(() => {
    const selectedNodes = state.nodes.filter(n => state.selectedNodeIds.includes(n.id));
    const selectedNotes = state.stickyNotes.filter(n => state.selectedNoteIds.includes(n.id));
    const selectedGroups = state.groups.filter(g => state.selectedGroupIds.includes(g.id));

    if (selectedNodes.length === 0 && selectedNotes.length === 0 && selectedGroups.length === 0) return;

    // Copy connections that are fully within the selection
    const selectedNodeIdSet = new Set(state.selectedNodeIds);
    const selectedConns = state.connections.filter(c => selectedNodeIdSet.has(c.from) && selectedNodeIdSet.has(c.to));

    clipboardRef.current = {
      nodes: selectedNodes.map(n => ({ ...n })),
      notes: selectedNotes.map(n => ({ ...n })),
      groups: selectedGroups.map(g => ({ ...g })),
      connections: selectedConns.map(c => ({ ...c })),
    };
    pasteCountRef.current = 0;
    showToast(`Copied ${selectedNodes.length + selectedNotes.length + selectedGroups.length} item(s)`);
  }, [state.nodes, state.stickyNotes, state.groups, state.connections, state.selectedNodeIds, state.selectedNoteIds, state.selectedGroupIds]);

  // Paste copied items at current viewport center
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current) return;
    pasteCountRef.current++;

    const clip = clipboardRef.current;
    // Compute bounding box center of copied items
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    clip.nodes.forEach((n: any) => {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 170); maxY = Math.max(maxY, n.y + 90);
    });
    clip.notes.forEach((n: any) => {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 200)); maxY = Math.max(maxY, n.y + (n.height || 150));
    });
    clip.groups.forEach((g: any) => {
      minX = Math.min(minX, g.x); minY = Math.min(minY, g.y);
      maxX = Math.max(maxX, g.x + (g.width || 400)); maxY = Math.max(maxY, g.y + (g.height || 300));
    });

    const clipCenterX = (minX + maxX) / 2;
    const clipCenterY = (minY + maxY) / 2;

    // Compute viewport center in canvas coordinates
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const viewW = rect?.width || window.innerWidth;
    const viewH = rect?.height || window.innerHeight;
    const viewCenterX = (viewW / 2 - state.panX) / state.scale;
    const viewCenterY = (viewH / 2 - state.panY) / state.scale;

    // Offset so items center on viewport center, with slight cascade for repeated pastes
    const cascade = pasteCountRef.current * 30;
    const offsetX = viewCenterX - clipCenterX + cascade;
    const offsetY = viewCenterY - clipCenterY + cascade;

    dispatch({
      type: 'PASTE_ITEMS',
      payload: {
        nodes: clip.nodes,
        notes: clip.notes,
        groups: clip.groups,
        connections: clip.connections,
        offsetX,
        offsetY,
      },
    });
  }, [dispatch, state.panX, state.panY, state.scale]);

  // Image upload
  const handleTriggerImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !state.authToken) return;
    try {
      const result = await API.uploadImage(file);
      if ('error' in result) {
        showToast('Upload failed: ' + result.error);
        return;
      }
      dispatch({ type: 'ADD_IMAGE', payload: { imageId: result.imageId, x: 400, y: 300 } });
      showToast('Image added!');
    } catch (e) {
      showToast('Upload failed');
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  }, [state.authToken, dispatch]);

  // Marquee selection handlers
  const handleMarqueeStart = useCallback((x: number, y: number) => {
    dispatch({ type: 'CLEAR_SELECTION' });
    setMarqueeStart({ x, y });
    setMarqueeRect({ x, y, width: 0, height: 0 });
  }, [dispatch]);

  const handleMarqueeMove = useCallback((currentX: number, currentY: number) => {
    if (!marqueeStart) return;
    const x = Math.min(marqueeStart.x, currentX);
    const y = Math.min(marqueeStart.y, currentY);
    const width = Math.abs(currentX - marqueeStart.x);
    const height = Math.abs(currentY - marqueeStart.y);
    setMarqueeRect({ x, y, width, height });
  }, [marqueeStart]);

  const handleMarqueeEnd = useCallback(() => {
    if (!marqueeRect || (marqueeRect.width < 5 && marqueeRect.height < 5)) {
      setMarqueeStart(null);
      setMarqueeRect(null);
      return;
    }

    // Find all objects within the marquee rectangle
    const r = marqueeRect;
    const nodeIds = state.nodes.filter(n => {
      const el = document.getElementById('node-' + n.id);
      const w = n.width || el?.offsetWidth || 170;
      const h = n.height || el?.offsetHeight || 90;
      return n.x < r.x + r.width && n.x + w > r.x && n.y < r.y + r.height && n.y + h > r.y;
    }).map(n => n.id);

    const noteIds = state.stickyNotes.filter(n => {
      return n.x < r.x + r.width && n.x + (n.width || 200) > r.x && n.y < r.y + r.height && n.y + (n.height || 150) > r.y;
    }).map(n => n.id);

    const groupIds = state.groups.filter(g => {
      return g.x < r.x + r.width && g.x + g.width > r.x && g.y < r.y + r.height && g.y + g.height > r.y;
    }).map(g => g.id);

    if (nodeIds.length > 0 || noteIds.length > 0 || groupIds.length > 0) {
      dispatch({ type: 'SELECT_MULTIPLE', payload: { nodeIds, noteIds, groupIds } });
    }

    setMarqueeStart(null);
    setMarqueeRect(null);
  }, [marqueeRect, state.nodes, state.stickyNotes, state.groups, dispatch]);

  // Multi-drag handler for moving all selected objects together
  const handleMultiDragStart = useCallback((e: React.MouseEvent) => {
    const hasMultiSelection = state.selectedNodeIds.length + state.selectedNoteIds.length + state.selectedGroupIds.length > 0;
    if (!hasMultiSelection) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = screenToCanvas(e.clientX, e.clientY, rect, state.panX, state.panY, state.scale);
    multiDragRef.current = { dragging: true, lastX: p.x, lastY: p.y };

    const onMove = (ev: MouseEvent) => {
      if (!multiDragRef.current.dragging || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const pp = screenToCanvas(ev.clientX, ev.clientY, r, state.panX, state.panY, state.scale);
      const dx = pp.x - multiDragRef.current.lastX;
      const dy = pp.y - multiDragRef.current.lastY;
      multiDragRef.current.lastX = pp.x;
      multiDragRef.current.lastY = pp.y;
      dispatch({ type: 'MOVE_SELECTED', payload: { dx, dy } });
    };

    const onUp = () => {
      multiDragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [state.selectedNodeIds, state.selectedNoteIds, state.selectedGroupIds, state.panX, state.panY, state.scale, dispatch]);

  // Canvas interaction hook
  const {
    handleMouseDown: canvasMouseDown,
    handleCanvasClick: canvasClick,
    handleContextMenu: canvasContextMenu,
    handleDrop,
    handleDragOver,
    handleCanvasMouseDownForMarquee: canvasMouseDownForMarquee,
  } = useCanvasInteraction({
    containerRef,
    scale: state.scale,
    panX: state.panX,
    panY: state.panY,
    currentTool: state.currentTool,
    onZoom: (scale, panX, panY) => dispatch({ type: 'SET_ZOOM', payload: { scale, panX, panY } }),
    onPan: (panX, panY) => dispatch({ type: 'SET_PAN', payload: { panX, panY } }),
    onDropNode: handleDropNode,
    onDropGroup: handleDropGroup,
    onCanvasClick: handleCanvasClick,
    onContextMenu: handleContextMenu,
    onMarqueeStart: handleMarqueeStart,
    onMarqueeMove: handleMarqueeMove,
    onMarqueeEnd: handleMarqueeEnd,
  });

  // Keyboard shortcuts
  useKeyboard({
    onSetTool: (t: ToolMode) => dispatch({ type: 'SET_TOOL', payload: t }),
    onDelete: handleDelete,
    onSave: handleSave,
    onExport: handleExport,
    onFitToScreen: handleFitToScreen,
    onSelectAll: handleSelectAll,
    onImageUpload: handleTriggerImageUpload,
    onCopy: handleCopy,
    onPaste: handlePaste,
  });

  // Canvas cursor
  const canvasCursor = state.currentTool === 'connect' ? 'crosshair' : state.currentTool === 'note' ? 'cell' : 'default';

  return (
    <>
      {/* Docs page — full-screen overlay at /docs */}
      {window.location.pathname === '/docs' && <DocsPage />}
      {window.location.pathname === '/dev-docs' && <DevDocsPage />}

      {/* Login overlay — hide for shared diagram views */}
      {!shareRole && <LoginOverlay googleClientId={googleClientId} onCredentialResponse={handleCredentialResponse} devLoginEnabled={devLoginEnabled} />}

      {/* Admin overlay */}
      <AdminOverlay visible={adminVisible} onClose={() => setAdminVisible(false)} authToken={state.authToken} />

      {/* Topbar */}
      <Topbar
        diagramName={diagramName}
        onRenameDiagram={handleRenameDiagram}
        onSave={handleSave}
        onExport={handleExport}
        onShowTemplates={() => setTemplateVisible(true)}
        onToggleProjects={() => dispatch({ type: 'TOGGLE_PROJECT_PANEL' })}
        onToggleTheme={handleToggleTheme}
        onTriggerImageUpload={handleTriggerImageUpload}
        onSignOut={handleSignOut}
        onShowAdmin={() => { setAdminVisible(true); setUserMenuOpen(false); }}
        onToggleUserMenu={() => setUserMenuOpen(p => !p)}
        userMenuOpen={userMenuOpen}
        isReadOnly={isReadOnly}
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={imageInputRef}
        id="imageFileInput"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileSelect}
      />

      {/* Sidebar — hide for read-only shared views */}
      {!isReadOnly && <Sidebar onClickAdd={handleClickAddNode} onClickAddGroup={handleClickAddGroup} panelOpen={sidebarTab} onTabChange={setSidebarTab} onToggleAi={() => setAiPanelVisible(p => !p)} aiActive={aiPanelVisible} />}

      {/* Project Panel — hide for read-only shared views */}
      {!isReadOnly && (
        <ProjectPanel
          visible={state.projectPanelOpen}
          onLoadDiagram={handleLoadDiagram}
          onNewDiagram={handleNewDiagram}
        />
      )}

      {/* Canvas */}
      <div
        className="canvas-container"
        id="canvasContainer"
        ref={containerRef}
        style={{ cursor: canvasCursor }}
        onMouseDown={(e) => { canvasMouseDown(e); canvasMouseDownForMarquee(e); }}
        onClick={canvasClick}
        onContextMenu={canvasContextMenu}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          className={`canvas${isReadOnly ? ' read-only' : ''}`}
          id="canvas"
          ref={canvasRef}
          style={{
            transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`,
          }}
        >
          <div className="grid-bg" />

          {/* Marquee Selection */}
          <MarqueeSelection rect={marqueeRect} />

          {/* Group Containers (behind everything) */}
          {state.groups.map(group => (
            <GroupContainerComponent
              key={group.id}
              group={group}
              isSelected={state.selectedGroup === group.id}
              isMultiSelected={state.selectedGroupIds.includes(group.id)}
              containerRef={containerRef}
              onDragStart={() => setDraggingGroupId(group.id)}
              onDragEnd={() => setDraggingGroupId(null)}
              onMultiDragStart={handleMultiDragStart}
            />
          ))}

          {/* Alignment Guides */}
          <AlignmentGuides draggingNodeId={draggingNodeId} draggingGroupId={draggingGroupId} />

          {/* Connections SVG */}
          <ConnectionsSvg />

          {/* Temporary connection line while drawing */}
          {tempConn && (
            <svg className="temp-connection-line" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15, overflow: 'visible' }}>
              <line
                x1={tempConn.x1} y1={tempConn.y1}
                x2={tempConn.x2} y2={tempConn.y2}
                stroke={snapTarget ? '#4fff8f' : '#4f8ff7'}
                strokeWidth={snapTarget ? 2.5 : 2}
                strokeDasharray={snapTarget ? 'none' : '6 4'}
                opacity={snapTarget ? 1 : 0.8}
              />
              <circle
                cx={tempConn.x2} cy={tempConn.y2}
                r={snapTarget ? 8 : 6}
                fill={snapTarget ? '#4fff8f' : '#4f8ff7'}
                opacity={snapTarget ? 0.7 : 0.5}
              />
            </svg>
          )}

          {/* Images */}
          {state.canvasImages.map(img => (
            <CanvasImageComponent key={img.id} image={img} containerRef={containerRef} />
          ))}

          {/* Sticky Notes */}
          {state.stickyNotes.map(note => (
            <StickyNoteComponent
              key={note.id}
              note={note}
              containerRef={containerRef}
              isMultiSelected={state.selectedNoteIds.includes(note.id)}
              onMultiDragStart={handleMultiDragStart}
              onPortDragStart={handlePortDragStart}
              highlightedPorts={highlightedPorts}
              snapTarget={snapTarget}
            />
          ))}

          {/* Nodes */}
          {state.nodes.map((node, idx) => (
            <NodeComponent
              key={node.id}
              node={node}
              isSelected={state.selectedNode === node.id}
              isMultiSelected={state.selectedNodeIds.includes(node.id)}
              containerRef={containerRef}
              onPortDragStart={handlePortDragStart}
              onDragStart={() => setDraggingNodeId(node.id)}
              onDragEnd={() => setDraggingNodeId(null)}
              onMultiDragStart={handleMultiDragStart}
              zIndex={state.selectedNode === node.id ? 100 : 10 + idx}
              highlightedPorts={highlightedPorts}
              snapTarget={snapTarget}
            />
          ))}

          {/* Floating Text Toolbar */}
          <TextToolbar />
        </div>

        {/* Hint Overlay */}
        <HintOverlay />
      </div>

      {/* Minimap */}
      <Minimap />

      {/* Context Menu */}
      <ContextMenu
        visible={ctxMenu.visible}
        x={ctxMenu.x}
        y={ctxMenu.y}
        onAddNote={handleCtxAddNote}
        onAddGroup={(color) => dispatch({ type: 'ADD_GROUP', payload: { color, x: ctxMenu.canvasX, y: ctxMenu.canvasY } })}
        onSelectAll={handleSelectAll}
        onFitToScreen={handleFitToScreen}
        onClearCanvas={() => dispatch({ type: 'CLEAR_CANVAS' })}
        onGroupSelected={() => dispatch({ type: 'GROUP_SELECTED' })}
        hasSelection={state.selectedNodeIds.length + state.selectedNoteIds.length > 1}
        onClose={() => setCtxMenu(prev => ({ ...prev, visible: false }))}
      />

      {/* Template Modal */}
      <TemplateModal
        visible={templateVisible}
        onHide={() => setTemplateVisible(false)}
        onLoad={handleLoadTemplate}
      />

      {/* AI Prompt Panel */}
      <AiPromptPanel visible={aiPanelVisible} onClose={() => setAiPanelVisible(false)} />

      {/* Share/Export Modal */}
      {shareModalVisible && (
        <ShareModal diagramName={diagramName} onClose={() => setShareModalVisible(false)} onSave={handleSave} />
      )}

      {/* Access denied overlay for disabled shared links */}
      {shareAccessDenied && (
        <div className="access-denied-overlay">
          <div className="access-denied-box">
            <div className="access-denied-icon">🔒</div>
            <h2>Access Denied</h2>
            <p>This diagram is no longer publicly shared. The owner may have disabled public access.</p>
            <a href="/" className="access-denied-btn">Go to ArchFlow</a>
          </div>
        </div>
      )}

      {/* Read-only banner for shared viewer mode */}
      {isReadOnly && (
        <div className="read-only-banner">
          <span>Viewing shared diagram — read only</span>
          {!state.currentUser && (
            <span className="read-only-signin">
              <span className="read-only-divider">·</span>
              <a href="/" className="read-only-signin-link">Sign in to create your own</a>
            </span>
          )}
        </div>
      )}

      {/* Toast */}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <DiagramProvider>
      <AppInner />
    </DiagramProvider>
  );
}
