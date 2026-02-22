// Central state store — all modules import and mutate S directly
export const S = {
    // Diagram data
    nodes: [],
    connections: [],
    stickyNotes: [],
    canvasImages: [],

    // Selection / Tool
    selectedNode: null,
    currentTool: 'select',

    // Transform
    scale: 1,
    panX: 0,
    panY: 0,

    // Interaction flags
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    isDragging: false,
    dragNode: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    connectFrom: null,
    connectFromPort: null,
    tempLine: null,

    // Counters
    nodeIdCounter: 0,
    connectionIdCounter: 0,
    noteIdCounter: 0,
    imageIdCounter: 0,

    // Misc
    spacePressed: false,
    contextMenuX: 0,
    contextMenuY: 0,
    currentDiagramId: null,
    currentUser: null,
    authToken: null,
    projectPanelOpen: false,
    autoSaveTimer: null,
    dragType: null,
    theme: 'dark',

    // Google auth
    googleClientId: null,
    googleInitialized: false,

    // Touch state
    touchState: {
        active: false,
        lastDist: 0,
        lastMidX: 0,
        lastMidY: 0,
        startPanX: 0,
        startPanY: 0
    }
};
