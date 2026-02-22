// ============================================
// Core Data Types
// ============================================

export type TextAlign = 'left' | 'center' | 'right';
export type ListStyle = 'none' | 'bullet' | 'numbered';

export interface TextFormatting {
  fontSize?: number;   // in px, default 13
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: TextAlign;
  listStyle?: ListStyle;
  lineHeight?: number;  // multiplier, e.g. 1.0, 1.5, 2.0
  textColor?: string;   // NodeColor key for text color override
}

export interface DiagramNode {
  id: number;
  type: string;
  x: number;
  y: number;
  width?: number;   // user-set width (undefined = auto-size, min 170)
  height?: number;  // user-set height (undefined = auto-size, min 90)
  icon: string;
  title: string;
  desc: string;
  badge: string;
  color: NodeColor;
  titleFormat?: TextFormatting;
  descFormat?: TextFormatting;
}

export type ConnectionEndpointType = 'node' | 'note';

export interface Waypoint {
  x: number;
  y: number;
}

export interface Connection {
  id: number;
  from: number;
  fromType: ConnectionEndpointType;
  fromPort: PortPosition;
  to: number;
  toType: ConnectionEndpointType;
  toPort: PortPosition;
  color: NodeColor;
  label: string;
  direction: ConnectionDirection;
  routing: ConnectionRouting;
  waypoints?: Waypoint[]; // ordered list of user-placed intermediate points
  midOffset?: number; // legacy: single offset for orthogonal routing bend point
  bezierOffset?: { dx: number; dy: number }; // legacy: single offset for bezier/straight midpoint
  labelOffset?: { dx: number; dy: number }; // user-adjustable offset for label position
}

export interface StickyNote {
  id: number;
  x: number;
  y: number;
  color: NoteColor;
  text: string;
  width: number;
  height: number;
  textFormat?: TextFormatting;
}

export interface CanvasImage {
  id: number;
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroupContainer {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: NodeColor;
  title: string;
  childNodeIds: number[];
  childNoteIds: number[];
}

// ============================================
// Enums & Unions
// ============================================

export type NodeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink' | 'yellow';
export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink';
export type PortPosition = 'top' | 'bottom' | 'left' | 'right';
export type ToolMode = 'select' | 'connect' | 'note' | 'group';
export type ConnectionDirection = 'forward' | 'backward' | 'bidirectional' | 'none';
export type ConnectionRouting = 'bezier' | 'orthogonal' | 'straight';
export type Theme = 'dark' | 'light';

// ============================================
// Component Type Definition (sidebar items)
// ============================================

export interface ComponentType {
  icon: string;
  title: string;
  desc: string;
  badge: string;
  color: NodeColor;
}

export type ComponentTypes = Record<string, ComponentType>;

// ============================================
// Color Values Map
// ============================================

export type ColorValues = Record<NodeColor, string>;

// ============================================
// User & Auth
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}

// ============================================
// Diagram Data (for save/load)
// ============================================

export interface DiagramData {
  nodes: DiagramNode[];
  connections: Connection[];
  stickyNotes: StickyNote[];
  canvasImages: CanvasImage[];
  groups: GroupContainer[];
  nodeIdCounter: number;
  connectionIdCounter: number;
  noteIdCounter: number;
  imageIdCounter: number;
  groupIdCounter: number;
}

export interface DiagramMeta {
  _id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  data?: DiagramData;
}
