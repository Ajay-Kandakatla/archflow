import type { ComponentTypes, ColorValues } from '@/types';

// ============================================
// Component Type Definitions
// ============================================

export const CT: ComponentTypes = {
  // Client Layer
  'browser':        { icon: '🌐', title: 'Browser',       desc: 'Web client',              badge: 'Client',    color: 'blue' },
  'mobile':         { icon: '📱', title: 'Mobile App',     desc: 'iOS / Android',           badge: 'Client',    color: 'blue' },
  'desktop':        { icon: '🖥️', title: 'Desktop App',    desc: 'Native desktop',          badge: 'Client',    color: 'blue' },
  'iot':            { icon: '📡', title: 'IoT Device',     desc: 'Sensor / device',         badge: 'IoT',       color: 'blue' },
  // Network / Gateway
  'api-gateway':    { icon: '🚪', title: 'API Gateway',    desc: 'Route & auth',            badge: 'Gateway',   color: 'green' },
  'load-balancer':  { icon: '⚖️', title: 'Load Balancer',  desc: 'Distribute traffic',      badge: 'Network',   color: 'green' },
  'cdn':            { icon: '🌍', title: 'CDN',            desc: 'Content delivery',        badge: 'Edge',      color: 'green' },
  'dns':            { icon: '🔗', title: 'DNS',            desc: 'Name resolution',         badge: 'Network',   color: 'green' },
  // Application
  'server':         { icon: '⚙️', title: 'App Server',     desc: 'Business logic',          badge: 'Compute',   color: 'purple' },
  'microservice':   { icon: '🧩', title: 'Microservice',   desc: 'Service module',          badge: 'Service',   color: 'purple' },
  'serverless':     { icon: '⚡',  title: 'Serverless',     desc: 'Lambda / function',       badge: 'FaaS',      color: 'purple' },
  'auth':           { icon: '🔐', title: 'Auth Service',   desc: 'Authentication',          badge: 'Security',  color: 'purple' },
  // GraphQL
  'graphql':        { icon: '◈', title: 'GraphQL API',    desc: 'Query endpoint',          badge: 'GraphQL',   color: 'pink' },
  'supergraph':     { icon: '◉', title: 'Supergraph',     desc: 'Federated gateway',       badge: 'Federation', color: 'pink' },
  'subgraph':       { icon: '◇', title: 'Subgraph',       desc: 'Federated service',       badge: 'Federation', color: 'purple' },
  // Database / Storage
  'postgres':       { icon: '🐘', title: 'PostgreSQL',     desc: 'Relational DB',           badge: 'SQL',       color: 'red' },
  'mongodb':        { icon: '🍃', title: 'MongoDB',        desc: 'Document DB',             badge: 'NoSQL',     color: 'red' },
  'mysql':          { icon: '🗄️', title: 'MySQL',          desc: 'Relational DB',           badge: 'SQL',       color: 'red' },
  's3':             { icon: '📦', title: 'Object Store',   desc: 'S3 / blob storage',       badge: 'Storage',   color: 'orange' },
  // Cache / Queue
  'redis':          { icon: '💎', title: 'Redis',          desc: 'In-memory cache',         badge: 'Cache',     color: 'cyan' },
  'memcached':      { icon: '🧊', title: 'Memcached',      desc: 'Distributed cache',       badge: 'Cache',     color: 'cyan' },
  'kafka':          { icon: '📨', title: 'Kafka',          desc: 'Event streaming',         badge: 'Queue',     color: 'orange' },
  'rabbitmq':       { icon: '🐰', title: 'RabbitMQ',       desc: 'Message broker',          badge: 'Queue',     color: 'orange' },
  // Monitoring
  'monitoring':     { icon: '📊', title: 'Monitoring',     desc: 'Metrics & alerts',        badge: 'Ops',       color: 'pink' },
  'logging':        { icon: '📝', title: 'Logging',        desc: 'Log aggregation',         badge: 'Ops',       color: 'pink' },
  'analytics':      { icon: '📈', title: 'Analytics',      desc: 'Data insights',           badge: 'Analytics', color: 'yellow' },
  'search':         { icon: '🔍', title: 'Search',         desc: 'Full-text search',        badge: 'Search',    color: 'yellow' },
  // Basic Shapes
  'rectangle':      { icon: '▭', title: 'Rectangle',      desc: '',                        badge: '',          color: 'blue' },
  'rounded-rect':   { icon: '▢', title: 'Rounded',        desc: '',                        badge: '',          color: 'blue' },
  'circle':         { icon: '●', title: 'Circle',         desc: '',                        badge: '',          color: 'purple' },
  'diamond':        { icon: '◆', title: 'Diamond',        desc: '',                        badge: '',          color: 'green' },
  'pill':           { icon: '💊', title: 'Pill',           desc: '',                        badge: '',          color: 'cyan' },
  'hexagon':        { icon: '⬡', title: 'Hexagon',        desc: '',                        badge: '',          color: 'orange' },
  'cylinder':       { icon: '⬭', title: 'Cylinder',       desc: '',                        badge: '',          color: 'red' },
  'parallelogram':  { icon: '▱', title: 'Parallelogram',  desc: '',                        badge: '',          color: 'pink' },
  // Flowchart Shapes
  'fc-terminator':  { icon: '⬭', title: 'Start / End',    desc: '',                        badge: '',          color: 'green' },
  'fc-process':     { icon: '▭', title: 'Process',         desc: '',                        badge: '',          color: 'blue' },
  'fc-decision':    { icon: '◆', title: 'Decision',        desc: '',                        badge: '',          color: 'orange' },
  'fc-subprocess':  { icon: '▣', title: 'Subprocess',      desc: '',                        badge: '',          color: 'purple' },
  'fc-document':    { icon: '📄', title: 'Document',        desc: '',                        badge: '',          color: 'cyan' },
  'fc-data':        { icon: '▱', title: 'Data / IO',       desc: '',                        badge: '',          color: 'yellow' },
  'fc-database':    { icon: '⬭', title: 'Database',        desc: '',                        badge: '',          color: 'red' },
  'fc-manual':      { icon: '⏢', title: 'Manual Input',    desc: '',                        badge: '',          color: 'pink' },
  'fc-predefined':  { icon: '⊞', title: 'Predefined',      desc: '',                        badge: '',          color: 'purple' },
  'fc-connector':   { icon: '●', title: 'Connector',       desc: '',                        badge: '',          color: 'green' },
  'fc-delay':       { icon: '▷', title: 'Delay',           desc: '',                        badge: '',          color: 'orange' },
  'fc-merge':       { icon: '▽', title: 'Merge',           desc: '',                        badge: '',          color: 'cyan' },
  // Wireframe Elements
  'wf-button':      { icon: '',  title: 'Button',         desc: '',                        badge: '',          color: 'blue' },
  'wf-input':       { icon: '',  title: 'Text Input',     desc: '',                        badge: '',          color: 'blue' },
  'wf-text':        { icon: '',  title: 'Text Block',     desc: '',                        badge: '',          color: 'blue' },
  'wf-image':       { icon: '',  title: 'Image',          desc: '',                        badge: '',          color: 'blue' },
  'wf-browser':     { icon: '',  title: 'Browser',        desc: '',                        badge: '',          color: 'blue' },
  'wf-mobile':      { icon: '',  title: 'Mobile',         desc: '',                        badge: '',          color: 'blue' },
  'wf-card':        { icon: '',  title: 'Card',           desc: '',                        badge: '',          color: 'blue' },
  'wf-divider':     { icon: '',  title: 'Divider',        desc: '',                        badge: '',          color: 'blue' },
  'wf-header':      { icon: '',  title: 'Header',         desc: '',                        badge: '',          color: 'blue' },
  'wf-dropdown':    { icon: '',  title: 'Dropdown',       desc: '',                        badge: '',          color: 'blue' },
  'wf-checkbox':    { icon: '',  title: 'Checkbox',       desc: '',                        badge: '',          color: 'blue' },
  'wf-radio':       { icon: '',  title: 'Radio',          desc: '',                        badge: '',          color: 'blue' },
  'wf-toggle':      { icon: '',  title: 'Toggle',         desc: '',                        badge: '',          color: 'blue' },
  'wf-navbar':      { icon: '',  title: 'Navbar',         desc: '',                        badge: '',          color: 'blue' },
  'wf-table':       { icon: '',  title: 'Table',          desc: '',                        badge: '',          color: 'blue' },
  'wf-avatar':      { icon: '',  title: 'Avatar',         desc: '',                        badge: '',          color: 'blue' },
  'wf-progress':    { icon: '',  title: 'Progress',       desc: '',                        badge: '',          color: 'blue' },
  'wf-tabs':        { icon: '',  title: 'Tabs',           desc: '',                        badge: '',          color: 'blue' },
  'wf-pagination':  { icon: '',  title: 'Pagination',     desc: '',                        badge: '',          color: 'blue' },
  'wf-link':        { icon: '',  title: 'Link',           desc: '',                        badge: '',          color: 'blue' },
  'wf-video':       { icon: '',  title: 'Video',          desc: '',                        badge: '',          color: 'blue' },
  'wf-searchbar':   { icon: '',  title: 'Search Bar',     desc: '',                        badge: '',          color: 'blue' },
  'wf-breadcrumb':  { icon: '',  title: 'Breadcrumb',     desc: '',                        badge: '',          color: 'blue' },
  'wf-list':        { icon: '',  title: 'List',           desc: '',                        badge: '',          color: 'blue' },
  'wf-rating':      { icon: '',  title: 'Rating',         desc: '',                        badge: '',          color: 'blue' },
  // Icon Node (dynamically created with iconSvg data)
  'icon-node':      { icon: '⬡',  title: 'Icon',          desc: '',                        badge: '',          color: 'blue' },
};

// ============================================
// Type Classification
// ============================================

/** Shape types that render as geometric shapes (not rectangular cards) */
export const SHAPE_TYPES = new Set([
  'circle', 'diamond', 'hexagon', 'rectangle', 'rounded-rect',
  'pill', 'cylinder', 'parallelogram',
  'fc-terminator', 'fc-process', 'fc-decision', 'fc-subprocess',
  'fc-document', 'fc-data', 'fc-database', 'fc-manual',
  'fc-predefined', 'fc-connector', 'fc-delay', 'fc-merge',
]);

/** Icon node type — renders as a centered SVG icon */
export const ICON_NODE_TYPE = 'icon-node';

export function isIconNode(type: string): boolean {
  return type === ICON_NODE_TYPE;
}

/** Wireframe types that render as UI mockup elements */
export const WIREFRAME_TYPES = new Set([
  'wf-button', 'wf-input', 'wf-text', 'wf-image',
  'wf-browser', 'wf-mobile', 'wf-card', 'wf-divider',
  'wf-header', 'wf-dropdown', 'wf-checkbox', 'wf-radio',
  'wf-toggle', 'wf-navbar', 'wf-table', 'wf-avatar',
  'wf-progress', 'wf-tabs', 'wf-pagination', 'wf-link',
  'wf-video', 'wf-searchbar', 'wf-breadcrumb', 'wf-list',
  'wf-rating',
]);

export function isShapeType(type: string): boolean {
  return SHAPE_TYPES.has(type);
}

export function isWireframeType(type: string): boolean {
  return WIREFRAME_TYPES.has(type);
}

// ============================================
// Default Dimensions per Type
// ============================================

export const DEFAULT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  // Shapes
  'circle':         { width: 120, height: 120 },
  'diamond':        { width: 140, height: 140 },
  'hexagon':        { width: 130, height: 130 },
  'pill':           { width: 160, height: 80 },
  'cylinder':       { width: 120, height: 140 },
  'parallelogram':  { width: 160, height: 100 },
  'rectangle':      { width: 150, height: 100 },
  'rounded-rect':   { width: 150, height: 100 },
  // Flowchart shapes
  'fc-terminator':  { width: 160, height: 80 },
  'fc-process':     { width: 150, height: 90 },
  'fc-decision':    { width: 140, height: 140 },
  'fc-subprocess':  { width: 150, height: 90 },
  'fc-document':    { width: 140, height: 110 },
  'fc-data':        { width: 150, height: 100 },
  'fc-database':    { width: 120, height: 130 },
  'fc-manual':      { width: 150, height: 100 },
  'fc-predefined':  { width: 150, height: 90 },
  'fc-connector':   { width: 70, height: 70 },
  'fc-delay':       { width: 140, height: 80 },
  'fc-merge':       { width: 120, height: 100 },
  // Wireframe elements
  'wf-button':      { width: 120, height: 40 },
  'wf-input':       { width: 200, height: 60 },
  'wf-text':        { width: 200, height: 80 },
  'wf-image':       { width: 200, height: 150 },
  'wf-browser':     { width: 320, height: 240 },
  'wf-mobile':      { width: 180, height: 320 },
  'wf-card':        { width: 240, height: 160 },
  'wf-divider':     { width: 200, height: 20 },
  'wf-header':      { width: 400, height: 48 },
  'wf-dropdown':    { width: 180, height: 44 },
  'wf-checkbox':    { width: 160, height: 36 },
  'wf-radio':       { width: 160, height: 36 },
  'wf-toggle':      { width: 120, height: 36 },
  'wf-navbar':      { width: 400, height: 50 },
  'wf-table':       { width: 320, height: 200 },
  'wf-avatar':      { width: 60, height: 60 },
  'wf-progress':    { width: 200, height: 24 },
  'wf-tabs':        { width: 320, height: 40 },
  'wf-pagination':  { width: 260, height: 36 },
  'wf-link':        { width: 100, height: 24 },
  'wf-video':       { width: 320, height: 200 },
  'wf-searchbar':   { width: 260, height: 40 },
  'wf-breadcrumb':  { width: 240, height: 28 },
  'wf-list':        { width: 220, height: 160 },
  'wf-rating':      { width: 140, height: 28 },
  // Icon node
  'icon-node':      { width: 80, height: 80 },
};

// ============================================
// Wireframe Sidebar Items
// ============================================

export interface WireframeSidebarSection {
  title: string;
  items: { type: string; label: string }[];
}

export const WIREFRAME_SECTIONS: WireframeSidebarSection[] = [
  {
    title: 'Form Elements',
    items: [
      { type: 'wf-button',   label: 'Button' },
      { type: 'wf-input',    label: 'Input' },
      { type: 'wf-dropdown', label: 'Dropdown' },
      { type: 'wf-checkbox', label: 'Checkbox' },
      { type: 'wf-radio',    label: 'Radio' },
      { type: 'wf-toggle',   label: 'Toggle' },
      { type: 'wf-searchbar', label: 'Search Bar' },
    ],
  },
  {
    title: 'Content',
    items: [
      { type: 'wf-text',     label: 'Text' },
      { type: 'wf-header',   label: 'Header' },
      { type: 'wf-image',    label: 'Image' },
      { type: 'wf-video',    label: 'Video' },
      { type: 'wf-card',     label: 'Card' },
      { type: 'wf-list',     label: 'List' },
      { type: 'wf-avatar',   label: 'Avatar' },
      { type: 'wf-rating',   label: 'Rating' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { type: 'wf-navbar',      label: 'Navbar' },
      { type: 'wf-tabs',        label: 'Tabs' },
      { type: 'wf-breadcrumb',  label: 'Breadcrumb' },
      { type: 'wf-pagination',  label: 'Pagination' },
      { type: 'wf-link',        label: 'Link' },
    ],
  },
  {
    title: 'Layout',
    items: [
      { type: 'wf-browser',  label: 'Browser' },
      { type: 'wf-mobile',   label: 'Mobile' },
      { type: 'wf-divider',  label: 'Divider' },
      { type: 'wf-table',    label: 'Table' },
      { type: 'wf-progress', label: 'Progress' },
    ],
  },
];

// Flat list for backward compatibility
export const WIREFRAME_SHAPES = WIREFRAME_SECTIONS.flatMap(s => s.items);

// ============================================
// Color Hex Values
// ============================================

export const CV: ColorValues = {
  blue: '#6b9fdb',
  green: '#5bbf9a',
  purple: '#9b8acc',
  orange: '#d9a06a',
  red: '#d08080',
  cyan: '#5ab8c9',
  pink: '#c98aad',
  yellow: '#d4b05c',
};

// Darker, ADA-compliant colors for light theme (WCAG AA 4.5:1 on white)
export const CV_LIGHT: ColorValues = {
  blue: '#2563eb',
  green: '#059669',
  purple: '#7c3aed',
  orange: '#c2410c',
  red: '#dc2626',
  cyan: '#0891b2',
  pink: '#be185d',
  yellow: '#a16207',
};

// ============================================
// Sidebar Sections (for rendering)
// ============================================

export interface SidebarSection {
  title: string;
  items: { type: string; color: string }[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Client Layer',
    items: [
      { type: 'browser', color: 'blue' },
      { type: 'mobile', color: 'blue' },
      { type: 'desktop', color: 'blue' },
      { type: 'iot', color: 'blue' },
    ],
  },
  {
    title: 'Network / Gateway',
    items: [
      { type: 'api-gateway', color: 'green' },
      { type: 'load-balancer', color: 'green' },
      { type: 'cdn', color: 'green' },
      { type: 'dns', color: 'green' },
    ],
  },
  {
    title: 'Application',
    items: [
      { type: 'server', color: 'purple' },
      { type: 'microservice', color: 'purple' },
      { type: 'serverless', color: 'purple' },
      { type: 'auth', color: 'purple' },
    ],
  },
  {
    title: 'Database / Storage',
    items: [
      { type: 'postgres', color: 'red' },
      { type: 'mongodb', color: 'red' },
      { type: 'mysql', color: 'red' },
      { type: 's3', color: 'orange' },
    ],
  },
  {
    title: 'Cache / Queue',
    items: [
      { type: 'redis', color: 'cyan' },
      { type: 'memcached', color: 'cyan' },
      { type: 'kafka', color: 'orange' },
      { type: 'rabbitmq', color: 'orange' },
    ],
  },
  {
    title: 'GraphQL',
    items: [
      { type: 'graphql', color: 'pink' },
      { type: 'supergraph', color: 'pink' },
      { type: 'subgraph', color: 'purple' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { type: 'monitoring', color: 'pink' },
      { type: 'logging', color: 'pink' },
      { type: 'analytics', color: 'yellow' },
      { type: 'search', color: 'yellow' },
    ],
  },
];
