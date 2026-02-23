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
};

// ============================================
// Type Classification
// ============================================

/** Shape types that render as geometric shapes (not rectangular cards) */
export const SHAPE_TYPES = new Set([
  'circle', 'diamond', 'hexagon', 'rectangle', 'rounded-rect',
  'pill', 'cylinder', 'parallelogram',
]);

/** Wireframe types that render as UI mockup elements */
export const WIREFRAME_TYPES = new Set([
  'wf-button', 'wf-input', 'wf-text', 'wf-image',
  'wf-browser', 'wf-mobile', 'wf-card', 'wf-divider',
  'wf-header', 'wf-dropdown',
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
};

// ============================================
// Wireframe Sidebar Items
// ============================================

export const WIREFRAME_SHAPES = [
  { type: 'wf-button',   label: 'Button' },
  { type: 'wf-input',    label: 'Input' },
  { type: 'wf-text',     label: 'Text' },
  { type: 'wf-image',    label: 'Image' },
  { type: 'wf-browser',  label: 'Browser' },
  { type: 'wf-mobile',   label: 'Mobile' },
  { type: 'wf-card',     label: 'Card' },
  { type: 'wf-divider',  label: 'Divider' },
  { type: 'wf-header',   label: 'Header' },
  { type: 'wf-dropdown', label: 'Dropdown' },
];

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
