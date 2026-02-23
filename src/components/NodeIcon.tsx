import React from 'react';

// ============================================
// SVG Icon Components (18x18 viewBox, currentColor)
// ============================================

interface IconProps { size?: number }

// --- Client Layer ---

function BrowserIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="15" height="13" rx="2" />
      <line x1="1.5" y1="6.5" x2="16.5" y2="6.5" />
      <circle cx="4" cy="4.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="4.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8" cy="4.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MobileIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1" width="10" height="16" rx="2" />
      <line x1="4" y1="4" x2="14" y2="4" />
      <line x1="4" y1="14" x2="14" y2="14" />
      <circle cx="9" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DesktopIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="16" height="11" rx="1.5" />
      <line x1="6" y1="16" x2="12" y2="16" />
      <line x1="9" y1="13" x2="9" y2="16" />
    </svg>
  );
}

function IotIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="7" width="8" height="6" rx="1" />
      <line x1="3" y1="10" x2="5" y2="10" />
      <line x1="13" y1="10" x2="15" y2="10" />
      <line x1="7" y1="7" x2="7" y2="5" />
      <line x1="9" y1="7" x2="9" y2="5" />
      <line x1="11" y1="7" x2="11" y2="5" />
      <path d="M6 4 Q9 1 12 4" fill="none" />
      <path d="M4 5 Q9 -1 14 5" fill="none" />
    </svg>
  );
}

// --- Network / Gateway ---

function ApiGatewayIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16 L4 4 Q4 2 6 2 L12 2 Q14 2 14 4 L14 16" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <path d="M9 8 L9 15" />
      <path d="M7 10 L9 8 L11 10" />
    </svg>
  );
}

function LoadBalancerIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3" cy="9" r="1.5" />
      <circle cx="15" cy="4" r="1.5" />
      <circle cx="15" cy="9" r="1.5" />
      <circle cx="15" cy="14" r="1.5" />
      <line x1="4.5" y1="9" x2="13.5" y2="4" />
      <line x1="4.5" y1="9" x2="13.5" y2="9" />
      <line x1="4.5" y1="9" x2="13.5" y2="14" />
    </svg>
  );
}

function CdnIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <ellipse cx="9" cy="9" rx="3" ry="7" />
      <line x1="2" y1="9" x2="16" y2="9" />
      <path d="M3 5.5 Q9 4 15 5.5" fill="none" />
      <path d="M3 12.5 Q9 14 15 12.5" fill="none" />
    </svg>
  );
}

function DnsIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="3" r="2" />
      <circle cx="4" cy="14" r="2" />
      <circle cx="14" cy="14" r="2" />
      <line x1="9" y1="5" x2="5" y2="12" />
      <line x1="9" y1="5" x2="13" y2="12" />
      <line x1="6" y1="14" x2="12" y2="14" />
    </svg>
  );
}

// --- Application ---

function ServerIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="14" height="5" rx="1" />
      <rect x="2" y="11" width="14" height="5" rx="1" />
      <circle cx="13" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="13.5" r="0.8" fill="currentColor" stroke="none" />
      <line x1="5" y1="4.5" x2="10" y2="4.5" />
      <line x1="5" y1="13.5" x2="10" y2="13.5" />
    </svg>
  );
}

function MicroserviceIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5 L15.5 5.25 L15.5 12.75 L9 16.5 L2.5 12.75 L2.5 5.25 Z" />
    </svg>
  );
}

function ServerlessIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" stroke="none">
      <path d="M10.5 1 L4 10 L8 10 L7 17 L14 8 L10 8 Z" />
    </svg>
  );
}

function AuthIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5 L2.5 4.5 L2.5 9 Q2.5 14 9 16.5 Q15.5 14 15.5 9 L15.5 4.5 Z" />
      <circle cx="9" cy="8" r="1.5" />
      <line x1="9" y1="9.5" x2="9" y2="12" />
    </svg>
  );
}

// --- GraphQL ---

function GraphqlIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {/* Hexagon outline */}
      <path d="M9 1.5 L15 5 L15 12.5 L9 16 L3 12.5 L3 5 Z" />
      {/* Inner "G" stylized */}
      <circle cx="9" cy="9" r="3.5" fill="none" strokeWidth="1.5" />
      <line x1="9" y1="9" x2="12.5" y2="9" strokeWidth="1.5" />
    </svg>
  );
}

function SupergraphIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer ring = supergraph */}
      <circle cx="9" cy="9" r="7" strokeWidth="1.8" />
      {/* Three inner nodes = subgraphs */}
      <circle cx="9" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      {/* Lines connecting them */}
      <line x1="9" y1="6.5" x2="5.5" y2="10.5" />
      <line x1="9" y1="6.5" x2="12.5" y2="10.5" />
      <line x1="5.5" y1="12" x2="12.5" y2="12" />
    </svg>
  );
}

function SubgraphIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {/* Dashed circle = part of a larger graph */}
      <circle cx="9" cy="9" r="6.5" strokeDasharray="3 2" />
      {/* Central node */}
      <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
      {/* Connections radiating out */}
      <line x1="9" y1="7" x2="9" y2="3.5" />
      <line x1="10.8" y1="10" x2="14" y2="12.5" />
      <line x1="7.2" y1="10" x2="4" y2="12.5" />
    </svg>
  );
}

// --- Database / Storage ---

function PostgresIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" stroke="none">
      <path d="M12.5 2 Q15 2.5 15 5 Q15 7 13.5 8 L14 12 Q14.5 14 13 14 L12.5 14 L12 10 Q11 11 9 11 Q6 11 4 9 Q3 8 3 6 Q3 3 5 2 Q7 1 9 1 Q11 1 12.5 2 Z M7 5 Q6.5 5 6.5 5.5 Q6.5 6 7 6 Q7.5 6 7.5 5.5 Q7.5 5 7 5 Z M11 5 Q10.5 5 10.5 5.5 Q10.5 6 11 6 Q11.5 6 11.5 5.5 Q11.5 5 11 5 Z M7 7.5 Q9 9 11 7.5" />
    </svg>
  );
}

function MongodbIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5 Q13 5 13 9 Q13 14 9 16.5 Q5 14 5 9 Q5 5 9 1.5 Z" />
      <line x1="9" y1="4" x2="9" y2="14" />
    </svg>
  );
}

function MysqlIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="4" rx="6" ry="2.5" />
      <path d="M3 4 L3 14 Q3 16.5 9 16.5 Q15 16.5 15 14 L15 4" fill="none" />
      <path d="M3 9 Q9 11.5 15 9" fill="none" />
    </svg>
  );
}

function S3Icon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4 L5 15 Q5 16 9 16 Q13 16 13 15 L15 4 Q15 2 9 2 Q3 2 3 4 Z" />
      <path d="M3 4 Q9 6 15 4" fill="none" />
    </svg>
  );
}

// --- Cache / Queue ---

function RedisIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6 L9 2.5 L16 6 L9 9.5 Z" />
      <path d="M2 6 L2 9 L9 12.5 L16 9 L16 6" fill="none" />
      <path d="M2 9 L2 12 L9 15.5 L16 12 L16 9" fill="none" />
    </svg>
  );
}

function MemcachedIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="10" height="10" rx="1" />
      <line x1="4" y1="7" x2="2" y2="7" />
      <line x1="4" y1="9" x2="2" y2="9" />
      <line x1="4" y1="11" x2="2" y2="11" />
      <line x1="14" y1="7" x2="16" y2="7" />
      <line x1="14" y1="9" x2="16" y2="9" />
      <line x1="14" y1="11" x2="16" y2="11" />
      <line x1="7" y1="4" x2="7" y2="2" />
      <line x1="9" y1="4" x2="9" y2="2" />
      <line x1="11" y1="4" x2="11" y2="2" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function KafkaIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="5" x2="12" y2="5" />
      <path d="M10 3 L12 5 L10 7" fill="none" />
      <line x1="6" y1="9" x2="16" y2="9" />
      <path d="M14 7 L16 9 L14 11" fill="none" />
      <line x1="2" y1="13" x2="12" y2="13" />
      <path d="M10 11 L12 13 L10 15" fill="none" />
    </svg>
  );
}

function RabbitmqIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" stroke="none">
      <path d="M5.5 1 Q5 1 5 2 L5 6 Q5 7 6 7.5 Q4 8.5 3 10 Q2 11.5 2.5 13 Q3 14.5 5 15 Q6 15.5 9 15.5 Q12 15.5 13 15 Q15 14.5 15.5 13 Q16 11.5 15 10 Q14 8.5 12 7.5 Q13 7 13 6 L13 2 Q13 1 12.5 1 Q12 1 12 1.5 L11.5 5 Q11.5 6 11 6.5 L7 6.5 Q6.5 6 6.5 5 L6 1.5 Q6 1 5.5 1 Z M7 9.5 Q7 9 7.5 9 Q8 9 8 9.5 Q8 10 7.5 10 Q7 10 7 9.5 Z M10 9.5 Q10 9 10.5 9 Q11 9 11 9.5 Q11 10 10.5 10 Q10 10 10 9.5 Z" />
    </svg>
  );
}

// --- Monitoring ---

function MonitoringIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="2.5" height="5" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="7.75" y="6" width="2.5" height="9" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="11.5" y="3" width="2.5" height="12" rx="0.5" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="3" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}

function LoggingIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.5 L12 1.5 L15 4.5 L15 16.5 L3 16.5 L3 1.5 Z" />
      <path d="M12 1.5 L12 4.5 L15 4.5" fill="none" />
      <line x1="6" y1="8" x2="12" y2="8" />
      <line x1="6" y1="10.5" x2="12" y2="10.5" />
      <line x1="6" y1="13" x2="10" y2="13" />
    </svg>
  );
}

function AnalyticsIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="15" x2="16" y2="15" />
      <line x1="2" y1="2" x2="2" y2="15" />
      <polyline points="4,12 7,8 10,10 15,3" fill="none" />
      <path d="M13 3 L15 3 L15 5" fill="none" />
    </svg>
  );
}

function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="5" />
      <line x1="11" y1="11" x2="16" y2="16" />
    </svg>
  );
}

// --- Wireframe Elements ---

function WfButtonIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="8" rx="3" />
      <line x1="6" y1="9" x2="12" y2="9" />
    </svg>
  );
}

function WfInputIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="16" height="8" rx="1.5" />
      <line x1="4" y1="7.5" x2="4" y2="10.5" />
    </svg>
  );
}

function WfTextIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="4" x2="16" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="10" y2="12" />
    </svg>
  );
}

function WfImageIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="14" height="12" rx="1.5" />
      <line x1="2" y1="3" x2="16" y2="15" strokeWidth="0.8" />
      <line x1="16" y1="3" x2="2" y2="15" strokeWidth="0.8" />
    </svg>
  );
}

function WfBrowserIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="16" height="14" rx="2" />
      <line x1="1" y1="6" x2="17" y2="6" />
      <circle cx="3.5" cy="4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WfMobileIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="1" width="9" height="16" rx="2" />
      <line x1="7" y1="3" x2="11" y2="3" />
      <line x1="7" y1="15" x2="11" y2="15" />
    </svg>
  );
}

function WfCardIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="14" height="12" rx="2" />
      <line x1="2" y1="7" x2="16" y2="7" />
    </svg>
  );
}

function WfDividerIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="9" x2="16" y2="9" />
    </svg>
  );
}

function WfHeaderIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="16" height="8" rx="1.5" />
      <circle cx="4" cy="9" r="1.5" />
      <line x1="8" y1="9" x2="10" y2="9" />
      <line x1="12" y1="9" x2="14" y2="9" />
    </svg>
  );
}

function WfDropdownIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="8" rx="1.5" />
      <path d="M12 8 L14 10 L12 12" fill="none" strokeWidth="1.2" />
    </svg>
  );
}

// ============================================
// Type → Icon Map
// ============================================

const NODE_TYPE_ICONS: Record<string, React.FC<IconProps>> = {
  // Client Layer
  'browser': BrowserIcon,
  'mobile': MobileIcon,
  'desktop': DesktopIcon,
  'iot': IotIcon,
  // Network / Gateway
  'api-gateway': ApiGatewayIcon,
  'load-balancer': LoadBalancerIcon,
  'cdn': CdnIcon,
  'dns': DnsIcon,
  // Application
  'server': ServerIcon,
  'microservice': MicroserviceIcon,
  'serverless': ServerlessIcon,
  'auth': AuthIcon,
  // GraphQL
  'graphql': GraphqlIcon,
  'supergraph': SupergraphIcon,
  'subgraph': SubgraphIcon,
  // Database / Storage
  'postgres': PostgresIcon,
  'mongodb': MongodbIcon,
  'mysql': MysqlIcon,
  's3': S3Icon,
  // Cache / Queue
  'redis': RedisIcon,
  'memcached': MemcachedIcon,
  'kafka': KafkaIcon,
  'rabbitmq': RabbitmqIcon,
  // Monitoring
  'monitoring': MonitoringIcon,
  'logging': LoggingIcon,
  'analytics': AnalyticsIcon,
  'search': SearchIcon,
  // Wireframe
  'wf-button': WfButtonIcon,
  'wf-input': WfInputIcon,
  'wf-text': WfTextIcon,
  'wf-image': WfImageIcon,
  'wf-browser': WfBrowserIcon,
  'wf-mobile': WfMobileIcon,
  'wf-card': WfCardIcon,
  'wf-divider': WfDividerIcon,
  'wf-header': WfHeaderIcon,
  'wf-dropdown': WfDropdownIcon,
};

// ============================================
// Public Component
// ============================================

interface NodeIconProps {
  type: string;
  fallback?: string;
  size?: number;
  className?: string;
}

export function NodeIcon({ type, fallback, size = 20, className }: NodeIconProps) {
  const IconComponent = NODE_TYPE_ICONS[type];

  if (IconComponent) {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconComponent size={size} />
      </span>
    );
  }

  // Fallback: render emoji/text as before
  return <span className={className}>{fallback || ''}</span>;
}
