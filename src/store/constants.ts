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
};

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
    title: 'Monitoring',
    items: [
      { type: 'monitoring', color: 'pink' },
      { type: 'logging', color: 'pink' },
      { type: 'analytics', color: 'yellow' },
      { type: 'search', color: 'yellow' },
    ],
  },
];
