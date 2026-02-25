import React, { useState, useRef, useEffect } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import { CT } from '@/store/constants';
import { API } from '@/utils/api';
import type { DiagramData } from '@/types';

/**
 * AI Prompt Panel — Eraser.io-style interface with diagram type tabs,
 * large text area, and prominent Create button.
 */

interface AiPromptPanelProps {
  visible: boolean;
  onClose: () => void;
}

// Diagram type tabs
type DiagramType = 'auto' | 'architecture' | 'flowchart' | 'mindmap' | 'sequence';

const DIAGRAM_TABS: { key: DiagramType; label: string; icon: string }[] = [
  { key: 'auto', label: 'Auto', icon: '✨' },
  { key: 'architecture', label: 'Architecture', icon: '🏗️' },
  { key: 'flowchart', label: 'Flowchart', icon: '📊' },
  { key: 'mindmap', label: 'Mind map', icon: '🧠' },
  { key: 'sequence', label: 'Sequence', icon: '📋' },
];

// Map keywords to component types
const KEYWORD_MAP: Record<string, string> = {
  // Clients
  'browser': 'browser', 'web': 'browser', 'frontend': 'browser', 'client': 'browser', 'react': 'browser', 'vue': 'browser', 'angular': 'browser', 'next.js': 'browser', 'nextjs': 'browser',
  'mobile': 'mobile', 'ios': 'mobile', 'android': 'mobile', 'app': 'mobile', 'flutter': 'mobile', 'react native': 'mobile',
  'desktop': 'desktop', 'electron': 'desktop',
  'iot': 'iot', 'sensor': 'iot', 'device': 'iot',
  // Network
  'gateway': 'api-gateway', 'api gateway': 'api-gateway', 'api-gateway': 'api-gateway',
  'load balancer': 'load-balancer', 'load-balancer': 'load-balancer', 'lb': 'load-balancer', 'nginx': 'load-balancer',
  'cdn': 'cdn', 'cloudfront': 'cdn', 'content delivery': 'cdn',
  'dns': 'dns',
  // Application
  'server': 'server', 'backend': 'server', 'api': 'server', 'express': 'server', 'node': 'server', 'node.js': 'server', 'django': 'server', 'flask': 'server', 'spring': 'server', 'fastapi': 'server', 'nest': 'server', 'nestjs': 'server',
  'microservice': 'microservice', 'service': 'microservice',
  'lambda': 'serverless', 'serverless': 'serverless', 'function': 'serverless',
  'auth': 'auth', 'authentication': 'auth', 'oauth': 'auth', 'jwt': 'auth', 'login': 'auth',
  // Database
  'postgres': 'postgres', 'postgresql': 'postgres',
  'mongo': 'mongodb', 'mongodb': 'mongodb',
  'mysql': 'mysql', 'sql': 'mysql', 'database': 'postgres', 'db': 'postgres',
  's3': 's3', 'storage': 's3', 'blob': 's3', 'bucket': 's3', 'file storage': 's3',
  // Cache/Queue
  'redis': 'redis', 'cache': 'redis', 'caching': 'redis',
  'memcached': 'memcached',
  'kafka': 'kafka', 'event': 'kafka', 'stream': 'kafka', 'message queue': 'kafka',
  'rabbitmq': 'rabbitmq', 'queue': 'rabbitmq', 'mq': 'rabbitmq',
  // Monitoring
  'monitoring': 'monitoring', 'prometheus': 'monitoring', 'grafana': 'monitoring', 'metrics': 'monitoring',
  'logging': 'logging', 'elk': 'logging', 'log': 'logging',
  'analytics': 'analytics',
  'search': 'search', 'elasticsearch': 'search',
};

// Domain-aware templates
const DOMAIN_TEMPLATES: {
  patterns: RegExp[];
  name: string;
  generate: () => DiagramData;
}[] = [
  {
    patterns: [/financ|bank|payment|credit.?card|debit|transaction|ledger|fintech|trading|stock|invest|insurance|loan|mortgage/i],
    name: 'Financial Services Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Web Portal' },
      { type: 'mobile', x: 500, y: 50, title: 'Mobile Banking App' },
      { type: 'cdn', x: 350, y: 180, title: 'CDN / WAF' },
      { type: 'load-balancer', x: 350, y: 310, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 440, title: 'API Gateway' },
      { type: 'auth', x: 80, y: 570, title: 'Auth & KYC Service' },
      { type: 'microservice', x: 300, y: 570, title: 'Account Service' },
      { type: 'microservice', x: 520, y: 570, title: 'Transaction Service' },
      { type: 'microservice', x: 740, y: 570, title: 'Card Management' },
      { type: 'kafka', x: 400, y: 720, title: 'Event Bus (Kafka)' },
      { type: 'microservice', x: 80, y: 870, title: 'Fraud Detection' },
      { type: 'microservice', x: 300, y: 870, title: 'Notification Service' },
      { type: 'serverless', x: 520, y: 870, title: 'Rewards Engine' },
      { type: 'postgres', x: 80, y: 1030, title: 'Account DB' },
      { type: 'postgres', x: 300, y: 1030, title: 'Transaction Ledger' },
      { type: 'redis', x: 520, y: 1030, title: 'Session / Rate Limit' },
      { type: 'mongodb', x: 740, y: 1030, title: 'Audit Log' },
      { type: 'monitoring', x: 740, y: 870, title: 'Monitoring & Alerts' },
    ], [
      [0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8],
      [6, 9], [7, 9], [8, 9], [9, 10], [9, 11], [9, 12],
      [6, 13], [7, 14], [5, 15], [10, 16], [7, 17],
    ]),
  },
  {
    patterns: [/e.?commerce|shop|store|cart|checkout|product.?catalog|retail|marketplace|order|inventory/i],
    name: 'E-Commerce Platform Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Web Storefront' },
      { type: 'mobile', x: 500, y: 50, title: 'Mobile App' },
      { type: 'cdn', x: 350, y: 180, title: 'CDN (Images/Assets)' },
      { type: 'load-balancer', x: 350, y: 310, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 440, title: 'API Gateway' },
      { type: 'auth', x: 80, y: 580, title: 'Auth Service' },
      { type: 'microservice', x: 280, y: 580, title: 'Product Catalog' },
      { type: 'microservice', x: 480, y: 580, title: 'Cart & Checkout' },
      { type: 'microservice', x: 680, y: 580, title: 'Order Service' },
      { type: 'kafka', x: 380, y: 730, title: 'Event Bus' },
      { type: 'microservice', x: 80, y: 880, title: 'Inventory Service' },
      { type: 'microservice', x: 280, y: 880, title: 'Payment Service' },
      { type: 'microservice', x: 480, y: 880, title: 'Shipping Service' },
      { type: 'serverless', x: 680, y: 880, title: 'Email / Notification' },
      { type: 'postgres', x: 180, y: 1040, title: 'Products DB' },
      { type: 'postgres', x: 400, y: 1040, title: 'Orders DB' },
      { type: 'redis', x: 600, y: 1040, title: 'Cache (Redis)' },
      { type: 'search', x: 80, y: 1040, title: 'Search (Elastic)' },
      { type: 's3', x: 700, y: 1040, title: 'Media Storage' },
    ], [
      [0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8],
      [7, 9], [8, 9], [9, 10], [9, 11], [9, 12], [9, 13],
      [6, 14], [8, 15], [6, 16], [6, 17], [6, 18],
    ]),
  },
  {
    patterns: [/health|medical|hospital|patient|clinic|telemedicine|pharma|ehr|electronic.?health/i],
    name: 'Healthcare Platform Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Doctor Portal' },
      { type: 'mobile', x: 500, y: 50, title: 'Patient App' },
      { type: 'load-balancer', x: 350, y: 200, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 340, title: 'API Gateway (HIPAA)' },
      { type: 'auth', x: 100, y: 490, title: 'Auth & RBAC' },
      { type: 'microservice', x: 300, y: 490, title: 'Patient Service' },
      { type: 'microservice', x: 500, y: 490, title: 'Appointment Service' },
      { type: 'microservice', x: 700, y: 490, title: 'Prescription Service' },
      { type: 'kafka', x: 400, y: 640, title: 'Event Bus' },
      { type: 'serverless', x: 100, y: 790, title: 'Notification Service' },
      { type: 'microservice', x: 300, y: 790, title: 'Billing Service' },
      { type: 'microservice', x: 500, y: 790, title: 'Lab Results Service' },
      { type: 'postgres', x: 200, y: 950, title: 'Patient EHR DB' },
      { type: 'mongodb', x: 400, y: 950, title: 'Documents Store' },
      { type: 's3', x: 600, y: 950, title: 'Medical Imaging' },
      { type: 'monitoring', x: 700, y: 790, title: 'Audit & Compliance' },
    ], [
      [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6], [3, 7],
      [5, 8], [6, 8], [7, 8], [8, 9], [8, 10], [8, 11],
      [5, 12], [7, 13], [11, 14], [5, 15],
    ]),
  },
  {
    patterns: [/social|feed|timeline|post|follow|like|comment|community|forum|content.?platform|blog/i],
    name: 'Social Platform Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Web Client' },
      { type: 'mobile', x: 500, y: 50, title: 'Mobile App' },
      { type: 'cdn', x: 350, y: 180, title: 'CDN' },
      { type: 'load-balancer', x: 350, y: 310, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 440, title: 'API Gateway' },
      { type: 'auth', x: 100, y: 580, title: 'Auth (OAuth2)' },
      { type: 'microservice', x: 300, y: 580, title: 'User Service' },
      { type: 'microservice', x: 500, y: 580, title: 'Feed Service' },
      { type: 'microservice', x: 700, y: 580, title: 'Content Service' },
      { type: 'kafka', x: 400, y: 720, title: 'Event Stream' },
      { type: 'microservice', x: 100, y: 860, title: 'Notification Service' },
      { type: 'microservice', x: 300, y: 860, title: 'Recommendation' },
      { type: 'search', x: 500, y: 860, title: 'Search Service' },
      { type: 'postgres', x: 100, y: 1010, title: 'Users DB' },
      { type: 'mongodb', x: 300, y: 1010, title: 'Posts DB' },
      { type: 'redis', x: 500, y: 1010, title: 'Feed Cache' },
      { type: 's3', x: 700, y: 1010, title: 'Media Storage' },
    ], [
      [0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8],
      [7, 9], [8, 9], [9, 10], [9, 11], [9, 12],
      [6, 13], [7, 14], [7, 15], [8, 16],
    ]),
  },
  {
    patterns: [/education|learning|course|student|lms|school|university|classroom|e.?learning|tutor/i],
    name: 'E-Learning Platform Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Student Portal' },
      { type: 'mobile', x: 500, y: 50, title: 'Mobile App' },
      { type: 'cdn', x: 350, y: 200, title: 'Video CDN' },
      { type: 'api-gateway', x: 350, y: 340, title: 'API Gateway' },
      { type: 'auth', x: 100, y: 490, title: 'Auth / SSO' },
      { type: 'microservice', x: 300, y: 490, title: 'Course Service' },
      { type: 'microservice', x: 500, y: 490, title: 'Enrollment Service' },
      { type: 'server', x: 700, y: 490, title: 'Video Streaming' },
      { type: 'kafka', x: 400, y: 640, title: 'Event Bus' },
      { type: 'microservice', x: 150, y: 790, title: 'Progress Tracking' },
      { type: 'microservice', x: 400, y: 790, title: 'Assessment Engine' },
      { type: 'serverless', x: 650, y: 790, title: 'Certificate Gen' },
      { type: 'postgres', x: 200, y: 950, title: 'Course DB' },
      { type: 'mongodb', x: 400, y: 950, title: 'Content Store' },
      { type: 's3', x: 600, y: 950, title: 'Video Storage' },
      { type: 'redis', x: 700, y: 640, title: 'Session Cache' },
    ], [
      [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6], [3, 7],
      [5, 8], [6, 8], [8, 9], [8, 10], [8, 11],
      [5, 12], [5, 13], [7, 14], [3, 15],
    ]),
  },
  {
    patterns: [/gaming|game|multiplayer|player|leaderboard|matchmak/i],
    name: 'Gaming Platform Architecture',
    generate: () => buildDiagram([
      { type: 'desktop', x: 200, y: 50, title: 'Game Client (PC)' },
      { type: 'mobile', x: 500, y: 50, title: 'Mobile Game' },
      { type: 'load-balancer', x: 350, y: 200, title: 'Load Balancer' },
      { type: 'server', x: 150, y: 350, title: 'Game Server' },
      { type: 'server', x: 350, y: 350, title: 'Matchmaking' },
      { type: 'server', x: 550, y: 350, title: 'WebSocket Server' },
      { type: 'redis', x: 150, y: 500, title: 'Leaderboard (Redis)' },
      { type: 'kafka', x: 350, y: 500, title: 'Event Bus' },
      { type: 'auth', x: 550, y: 500, title: 'Auth Service' },
      { type: 'postgres', x: 150, y: 650, title: 'Player DB' },
      { type: 'mongodb', x: 350, y: 650, title: 'Game State Store' },
      { type: 'analytics', x: 550, y: 650, title: 'Analytics' },
    ], [
      [0, 2], [1, 2], [2, 3], [2, 4], [2, 5],
      [3, 6], [3, 7], [4, 7], [5, 8],
      [7, 9], [7, 10], [7, 11],
    ]),
  },
  {
    patterns: [/saas|multi.?tenant|subscription|crm|erp|project.?management|team|workspace|collaboration/i],
    name: 'SaaS Application Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 350, y: 50, title: 'Web Dashboard' },
      { type: 'cdn', x: 350, y: 180, title: 'CDN' },
      { type: 'load-balancer', x: 350, y: 310, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 440, title: 'API Gateway' },
      { type: 'auth', x: 100, y: 580, title: 'Auth / SSO / RBAC' },
      { type: 'microservice', x: 300, y: 580, title: 'Tenant Service' },
      { type: 'microservice', x: 500, y: 580, title: 'Core App Service' },
      { type: 'microservice', x: 700, y: 580, title: 'Billing Service' },
      { type: 'kafka', x: 400, y: 720, title: 'Event Bus' },
      { type: 'serverless', x: 150, y: 870, title: 'Email Service' },
      { type: 'serverless', x: 350, y: 870, title: 'Webhook Delivery' },
      { type: 'analytics', x: 550, y: 870, title: 'Usage Analytics' },
      { type: 'postgres', x: 150, y: 1020, title: 'Multi-Tenant DB' },
      { type: 'redis', x: 350, y: 1020, title: 'Cache & Sessions' },
      { type: 's3', x: 550, y: 1020, title: 'File Storage' },
      { type: 'monitoring', x: 700, y: 870, title: 'Monitoring' },
    ], [
      [0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6], [3, 7],
      [5, 8], [6, 8], [7, 8], [8, 9], [8, 10], [8, 11],
      [5, 12], [6, 13], [6, 14], [6, 15],
    ]),
  },
  {
    patterns: [/iot|smart.?home|sensor|telemetry|connected.?device|industrial|scada|embedded/i],
    name: 'IoT Platform Architecture',
    generate: () => buildDiagram([
      { type: 'iot', x: 100, y: 50, title: 'Sensors / Devices' },
      { type: 'iot', x: 350, y: 50, title: 'Edge Gateway' },
      { type: 'iot', x: 600, y: 50, title: 'Mobile Controller' },
      { type: 'api-gateway', x: 350, y: 200, title: 'IoT Hub / MQTT' },
      { type: 'kafka', x: 350, y: 350, title: 'Event Stream (Kafka)' },
      { type: 'serverless', x: 100, y: 500, title: 'Rule Engine' },
      { type: 'serverless', x: 350, y: 500, title: 'Data Transform' },
      { type: 'serverless', x: 600, y: 500, title: 'Alert Service' },
      { type: 'mongodb', x: 100, y: 660, title: 'Time-Series DB' },
      { type: 'postgres', x: 350, y: 660, title: 'Device Registry' },
      { type: 'analytics', x: 600, y: 660, title: 'Dashboard' },
      { type: 'monitoring', x: 350, y: 820, title: 'Device Monitoring' },
    ], [
      [0, 1], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7],
      [6, 8], [5, 9], [8, 10], [9, 11],
    ]),
  },
  {
    patterns: [/food|delivery|restaurant|uber.?eats|doordash|ride|taxi|logistics|fleet|dispatch|courier/i],
    name: 'On-Demand Delivery Architecture',
    generate: () => buildDiagram([
      { type: 'mobile', x: 100, y: 50, title: 'Customer App' },
      { type: 'mobile', x: 350, y: 50, title: 'Driver App' },
      { type: 'browser', x: 600, y: 50, title: 'Admin Dashboard' },
      { type: 'load-balancer', x: 350, y: 200, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 340, title: 'API Gateway' },
      { type: 'auth', x: 80, y: 480, title: 'Auth Service' },
      { type: 'microservice', x: 280, y: 480, title: 'Order Service' },
      { type: 'microservice', x: 480, y: 480, title: 'Dispatch / Matching' },
      { type: 'microservice', x: 680, y: 480, title: 'Location Tracker' },
      { type: 'kafka', x: 380, y: 630, title: 'Event Stream' },
      { type: 'microservice', x: 100, y: 780, title: 'Payment Service' },
      { type: 'serverless', x: 300, y: 780, title: 'Push Notifications' },
      { type: 'microservice', x: 500, y: 780, title: 'Rating Service' },
      { type: 'postgres', x: 200, y: 930, title: 'Orders DB' },
      { type: 'redis', x: 400, y: 930, title: 'Location Cache' },
      { type: 'mongodb', x: 600, y: 930, title: 'Tracking Logs' },
    ], [
      [0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8],
      [6, 9], [7, 9], [8, 9], [9, 10], [9, 11], [9, 12],
      [6, 13], [8, 14], [8, 15],
    ]),
  },
  {
    patterns: [/video|streaming|netflix|youtube|media|vod|live.?stream|content.?delivery/i],
    name: 'Video Streaming Architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Web Player' },
      { type: 'mobile', x: 500, y: 50, title: 'Mobile App' },
      { type: 'cdn', x: 350, y: 200, title: 'Video CDN' },
      { type: 'load-balancer', x: 350, y: 330, title: 'Load Balancer' },
      { type: 'api-gateway', x: 350, y: 460, title: 'API Gateway' },
      { type: 'auth', x: 100, y: 600, title: 'Auth / Subscription' },
      { type: 'microservice', x: 300, y: 600, title: 'Content Catalog' },
      { type: 'microservice', x: 500, y: 600, title: 'Recommendation' },
      { type: 'serverless', x: 700, y: 600, title: 'Transcoding' },
      { type: 'kafka', x: 400, y: 750, title: 'Event Stream' },
      { type: 'postgres', x: 150, y: 900, title: 'Users & Subs DB' },
      { type: 'mongodb', x: 350, y: 900, title: 'Content Metadata' },
      { type: 's3', x: 550, y: 900, title: 'Video Storage' },
      { type: 'redis', x: 700, y: 750, title: 'Session Cache' },
      { type: 'analytics', x: 150, y: 750, title: 'View Analytics' },
    ], [
      [0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [4, 8],
      [6, 9], [7, 9], [9, 14], [5, 10], [6, 11], [8, 12], [4, 13],
    ]),
  },
];

// Flowchart-specific templates
const FLOWCHART_TEMPLATES: {
  patterns: RegExp[];
  name: string;
  generate: () => DiagramData;
}[] = [
  {
    patterns: [/login|auth|sign.?up|register|onboard/i],
    name: 'User Authentication Flow',
    generate: () => buildDiagram([
      { type: 'browser', x: 350, y: 50, title: 'User Lands on App' },
      { type: 'auth', x: 350, y: 200, title: 'Has Account?' },
      { type: 'server', x: 150, y: 350, title: 'Registration Form' },
      { type: 'server', x: 550, y: 350, title: 'Login Form' },
      { type: 'auth', x: 150, y: 500, title: 'Validate Email' },
      { type: 'auth', x: 550, y: 500, title: 'Verify Credentials' },
      { type: 'serverless', x: 150, y: 650, title: 'Send Verification' },
      { type: 'redis', x: 550, y: 650, title: 'Generate JWT' },
      { type: 'server', x: 350, y: 800, title: 'Dashboard / Home' },
    ], [
      [0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 8],
    ]),
  },
  {
    patterns: [/order|checkout|purchase|buy|payment.?flow|cart/i],
    name: 'Order Processing Flow',
    generate: () => buildDiagram([
      { type: 'browser', x: 350, y: 50, title: 'Add to Cart' },
      { type: 'server', x: 350, y: 200, title: 'Checkout Page' },
      { type: 'auth', x: 350, y: 350, title: 'Validate Order' },
      { type: 'microservice', x: 150, y: 500, title: 'Payment Processing' },
      { type: 'microservice', x: 550, y: 500, title: 'Inventory Check' },
      { type: 'serverless', x: 350, y: 650, title: 'Order Confirmation' },
      { type: 'microservice', x: 150, y: 800, title: 'Shipping Label' },
      { type: 'serverless', x: 550, y: 800, title: 'Email Receipt' },
      { type: 'analytics', x: 350, y: 950, title: 'Track Delivery' },
    ], [
      [0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7], [6, 8],
    ]),
  },
  {
    patterns: [/ci.?cd|deploy|pipeline|build|release|devops/i],
    name: 'CI/CD Pipeline Flow',
    generate: () => buildDiagram([
      { type: 'desktop', x: 350, y: 50, title: 'Developer Push' },
      { type: 'server', x: 350, y: 200, title: 'CI Server (Build)' },
      { type: 'serverless', x: 150, y: 350, title: 'Run Tests' },
      { type: 'serverless', x: 550, y: 350, title: 'Code Analysis' },
      { type: 'server', x: 350, y: 500, title: 'Build Artifact' },
      { type: 'server', x: 150, y: 650, title: 'Deploy Staging' },
      { type: 'monitoring', x: 550, y: 650, title: 'Integration Tests' },
      { type: 'server', x: 350, y: 800, title: 'Deploy Production' },
      { type: 'monitoring', x: 350, y: 950, title: 'Health Check' },
    ], [
      [0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
    ]),
  },
];

// Mind map-specific templates
const MINDMAP_TEMPLATES: {
  patterns: RegExp[];
  name: string;
  generate: () => DiagramData;
}[] = [
  {
    patterns: [/system|architect|design|overview/i],
    name: 'System Design Mind Map',
    generate: () => buildDiagram([
      { type: 'server', x: 400, y: 350, title: 'System Design' },
      { type: 'browser', x: 100, y: 100, title: 'Frontend' },
      { type: 'server', x: 700, y: 100, title: 'Backend' },
      { type: 'postgres', x: 100, y: 600, title: 'Database' },
      { type: 'monitoring', x: 700, y: 600, title: 'DevOps' },
      { type: 'auth', x: 50, y: 250, title: 'React / Vue' },
      { type: 'cdn', x: 200, y: 200, title: 'CSS / Styling' },
      { type: 'microservice', x: 600, y: 200, title: 'APIs' },
      { type: 'kafka', x: 800, y: 250, title: 'Messaging' },
      { type: 'redis', x: 50, y: 500, title: 'Caching' },
      { type: 'mongodb', x: 200, y: 650, title: 'NoSQL' },
      { type: 'serverless', x: 600, y: 500, title: 'CI/CD' },
      { type: 'load-balancer', x: 800, y: 650, title: 'Scaling' },
    ], [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 5], [1, 6], [2, 7], [2, 8],
      [3, 9], [3, 10], [4, 11], [4, 12],
    ]),
  },
];

// Sequence diagram templates
const SEQUENCE_TEMPLATES: {
  patterns: RegExp[];
  name: string;
  generate: () => DiagramData;
}[] = [
  {
    patterns: [/api|request|response|http|rest/i],
    name: 'API Request Sequence',
    generate: () => buildDiagram([
      { type: 'browser', x: 100, y: 50, title: 'Client' },
      { type: 'api-gateway', x: 350, y: 50, title: 'API Gateway' },
      { type: 'auth', x: 600, y: 50, title: 'Auth Service' },
      { type: 'server', x: 850, y: 50, title: 'App Server' },
      { type: 'browser', x: 100, y: 200, title: '1. Send Request' },
      { type: 'api-gateway', x: 350, y: 200, title: '2. Route & Validate' },
      { type: 'auth', x: 600, y: 200, title: '3. Check Token' },
      { type: 'auth', x: 600, y: 350, title: '4. Token Valid' },
      { type: 'server', x: 850, y: 350, title: '5. Process Request' },
      { type: 'server', x: 850, y: 500, title: '6. Query Database' },
      { type: 'api-gateway', x: 350, y: 500, title: '7. Return Response' },
      { type: 'browser', x: 100, y: 500, title: '8. Display Result' },
    ], [
      [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11],
    ]),
  },
];

// Architecture templates (keyword-based)
const ARCH_TEMPLATES: Record<string, { keywords: string[]; description: string; generate: () => DiagramData }> = {
  'web-app': {
    keywords: ['web app', 'web application', 'website', 'full stack', 'fullstack'],
    description: 'Standard web application',
    generate: () => buildDiagram([
      { type: 'browser', x: 400, y: 50, title: 'Web Browser' },
      { type: 'cdn', x: 400, y: 200, title: 'CDN' },
      { type: 'load-balancer', x: 400, y: 350, title: 'Load Balancer' },
      { type: 'server', x: 250, y: 500, title: 'App Server 1' },
      { type: 'server', x: 550, y: 500, title: 'App Server 2' },
      { type: 'redis', x: 150, y: 650, title: 'Redis Cache' },
      { type: 'postgres', x: 400, y: 700, title: 'PostgreSQL' },
      { type: 's3', x: 650, y: 650, title: 'File Storage' },
    ], [
      [0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [3, 6], [4, 6], [4, 7],
    ]),
  },
  'microservices': {
    keywords: ['microservice', 'microservices', 'distributed', 'soa'],
    description: 'Microservices architecture',
    generate: () => buildDiagram([
      { type: 'browser', x: 400, y: 50, title: 'Client' },
      { type: 'api-gateway', x: 400, y: 200, title: 'API Gateway' },
      { type: 'auth', x: 150, y: 350, title: 'Auth Service' },
      { type: 'microservice', x: 400, y: 350, title: 'User Service' },
      { type: 'microservice', x: 650, y: 350, title: 'Product Service' },
      { type: 'kafka', x: 400, y: 500, title: 'Event Bus (Kafka)' },
      { type: 'microservice', x: 150, y: 650, title: 'Order Service' },
      { type: 'microservice', x: 650, y: 650, title: 'Notification Service' },
      { type: 'postgres', x: 150, y: 800, title: 'Orders DB' },
      { type: 'mongodb', x: 400, y: 800, title: 'Users DB' },
      { type: 'postgres', x: 650, y: 800, title: 'Products DB' },
    ], [
      [0, 1], [1, 2], [1, 3], [1, 4], [3, 5], [4, 5], [5, 6], [5, 7], [6, 8], [3, 9], [4, 10],
    ]),
  },
  'mobile-backend': {
    keywords: ['mobile app', 'mobile backend', 'rest api'],
    description: 'Mobile app with backend',
    generate: () => buildDiagram([
      { type: 'mobile', x: 250, y: 50, title: 'iOS App' },
      { type: 'mobile', x: 550, y: 50, title: 'Android App' },
      { type: 'api-gateway', x: 400, y: 220, title: 'API Gateway' },
      { type: 'auth', x: 150, y: 380, title: 'Auth (Firebase)' },
      { type: 'server', x: 400, y: 380, title: 'REST API' },
      { type: 'serverless', x: 650, y: 380, title: 'Push Notifications' },
      { type: 'postgres', x: 250, y: 550, title: 'PostgreSQL' },
      { type: 'redis', x: 400, y: 550, title: 'Redis Cache' },
      { type: 's3', x: 550, y: 550, title: 'Media Storage' },
    ], [
      [0, 2], [1, 2], [2, 3], [2, 4], [2, 5], [4, 6], [4, 7], [4, 8],
    ]),
  },
  'data-pipeline': {
    keywords: ['data pipeline', 'etl', 'data processing', 'analytics', 'big data'],
    description: 'Data processing pipeline',
    generate: () => buildDiagram([
      { type: 'iot', x: 100, y: 50, title: 'Data Sources' },
      { type: 'server', x: 350, y: 50, title: 'API Ingest' },
      { type: 'kafka', x: 600, y: 50, title: 'Event Stream' },
      { type: 'serverless', x: 150, y: 250, title: 'ETL Lambda' },
      { type: 'serverless', x: 400, y: 250, title: 'Transform' },
      { type: 'serverless', x: 650, y: 250, title: 'Enrich' },
      { type: 'mongodb', x: 150, y: 450, title: 'Raw Store' },
      { type: 'postgres', x: 400, y: 450, title: 'Data Warehouse' },
      { type: 'search', x: 650, y: 450, title: 'Elasticsearch' },
      { type: 'analytics', x: 400, y: 620, title: 'Dashboard' },
    ], [
      [0, 1], [1, 2], [2, 3], [2, 4], [2, 5], [3, 6], [4, 7], [5, 8], [7, 9], [8, 9],
    ]),
  },
  'realtime': {
    keywords: ['realtime', 'real-time', 'chat', 'websocket', 'live'],
    description: 'Real-time application',
    generate: () => buildDiagram([
      { type: 'browser', x: 200, y: 50, title: 'Web Client' },
      { type: 'mobile', x: 550, y: 50, title: 'Mobile Client' },
      { type: 'load-balancer', x: 375, y: 220, title: 'Load Balancer' },
      { type: 'server', x: 200, y: 380, title: 'WebSocket Server' },
      { type: 'server', x: 550, y: 380, title: 'REST API' },
      { type: 'redis', x: 375, y: 530, title: 'Redis Pub/Sub' },
      { type: 'postgres', x: 200, y: 680, title: 'PostgreSQL' },
      { type: 'mongodb', x: 550, y: 680, title: 'Message Store' },
    ], [
      [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7],
    ]),
  },
};

function buildDiagram(
  nodeSpecs: { type: string; x: number; y: number; title: string }[],
  connectionSpecs: [number, number][],
): DiagramData {
  const nodes = nodeSpecs.map((spec, i) => {
    const ct = CT[spec.type];
    if (!ct) return null;
    return {
      id: i + 1,
      type: spec.type,
      x: spec.x,
      y: spec.y,
      icon: ct.icon,
      title: spec.title,
      desc: ct.desc,
      badge: ct.badge,
      color: ct.color,
    };
  }).filter(Boolean) as any[];

  const connections = connectionSpecs.map((spec, i) => {
    const fromNode = nodes[spec[0]];
    const toNode = nodes[spec[1]];
    if (!fromNode || !toNode) return null;
    let fromPort = 'bottom';
    let toPort = 'top';
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      fromPort = dx > 0 ? 'right' : 'left';
      toPort = dx > 0 ? 'left' : 'right';
    }
    return {
      id: i + 1,
      from: fromNode.id,
      fromType: 'node' as const,
      fromPort,
      to: toNode.id,
      toType: 'node' as const,
      toPort,
      color: fromNode.color,
      label: '',
      direction: 'forward' as const,
      routing: 'bezier' as const,
    };
  }).filter(Boolean) as any[];

  return {
    nodes,
    connections,
    stickyNotes: [],
    canvasImages: [],
    groups: [],
    nodeIdCounter: nodes.length,
    connectionIdCounter: connections.length,
    noteIdCounter: 0,
    imageIdCounter: 0,
    groupIdCounter: 0,
  };
}

// Parse text to find matching components
function parsePrompt(text: string, diagramType: DiagramType): { nodes: { type: string; title: string }[]; template: string | null; domainTemplate: typeof DOMAIN_TEMPLATES[number] | null } {
  const lower = text.toLowerCase();

  // Use type-specific templates based on tab selection
  if (diagramType === 'flowchart') {
    for (const dt of FLOWCHART_TEMPLATES) {
      for (const pattern of dt.patterns) {
        if (pattern.test(lower)) {
          return { nodes: [], template: null, domainTemplate: dt };
        }
      }
    }
  }

  if (diagramType === 'mindmap') {
    for (const dt of MINDMAP_TEMPLATES) {
      for (const pattern of dt.patterns) {
        if (pattern.test(lower)) {
          return { nodes: [], template: null, domainTemplate: dt };
        }
      }
    }
  }

  if (diagramType === 'sequence') {
    for (const dt of SEQUENCE_TEMPLATES) {
      for (const pattern of dt.patterns) {
        if (pattern.test(lower)) {
          return { nodes: [], template: null, domainTemplate: dt };
        }
      }
    }
  }

  // 1. Check for domain-aware template matches
  for (const dt of DOMAIN_TEMPLATES) {
    for (const pattern of dt.patterns) {
      if (pattern.test(lower)) {
        return { nodes: [], template: null, domainTemplate: dt };
      }
    }
  }

  // 2. Check for architecture template keyword matches
  for (const [key, tmpl] of Object.entries(ARCH_TEMPLATES)) {
    for (const kw of tmpl.keywords) {
      if (lower.includes(kw)) {
        return { nodes: [], template: key, domainTemplate: null };
      }
    }
  }

  // 3. Parse individual component keywords
  const foundTypes = new Set<string>();
  const nodes: { type: string; title: string }[] = [];
  const sortedKeywords = Object.entries(KEYWORD_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, componentType] of sortedKeywords) {
    if (lower.includes(keyword) && !foundTypes.has(componentType)) {
      foundTypes.add(componentType);
      const ct = CT[componentType];
      if (ct) {
        nodes.push({ type: componentType, title: ct.title });
      }
    }
  }

  return { nodes, template: null, domainTemplate: null };
}

// Lay out nodes in a nice grid
function layoutNodes(nodeSpecs: { type: string; title: string }[]): DiagramData {
  const cols = Math.ceil(Math.sqrt(nodeSpecs.length));
  const xSpacing = 250;
  const ySpacing = 200;
  const startX = 200;
  const startY = 100;

  const nodes = nodeSpecs.map((spec, i) => {
    const ct = CT[spec.type];
    if (!ct) return null;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id: i + 1,
      type: spec.type,
      x: startX + col * xSpacing,
      y: startY + row * ySpacing,
      icon: ct.icon,
      title: spec.title,
      desc: ct.desc,
      badge: ct.badge,
      color: ct.color,
    };
  }).filter(Boolean) as any[];

  const connections = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i];
    const to = nodes[i + 1];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let fromPort = 'right';
    let toPort = 'left';
    if (Math.abs(dy) > Math.abs(dx)) {
      fromPort = 'bottom';
      toPort = 'top';
    }
    connections.push({
      id: i + 1,
      from: from.id,
      fromType: 'node' as const,
      fromPort,
      to: to.id,
      toType: 'node' as const,
      toPort,
      color: from.color,
      label: '',
      direction: 'forward' as const,
      routing: 'bezier' as const,
    });
  }

  return {
    nodes,
    connections,
    stickyNotes: [],
    canvasImages: [],
    groups: [],
    nodeIdCounter: nodes.length,
    connectionIdCounter: connections.length,
    noteIdCounter: 0,
    imageIdCounter: 0,
    groupIdCounter: 0,
  };
}

// Prompt examples per tab
const TAB_PLACEHOLDERS: Record<DiagramType, string> = {
  auto: 'Describe your system or idea...',
  architecture: 'e.g. "Event streaming system for payment processing"',
  flowchart: 'e.g. "User login and authentication flow"',
  mindmap: 'e.g. "System design overview with frontend and backend"',
  sequence: 'e.g. "API request-response flow with auth"',
};

const TAB_SUGGESTIONS: Record<DiagramType, string[]> = {
  auto: ['Financial Platform', 'E-Commerce', 'Healthcare System', 'Social Media', 'SaaS App', 'IoT Platform'],
  architecture: ['Microservices', 'Web App', 'Mobile Backend', 'Data Pipeline', 'Real-time Chat', 'Video Streaming'],
  flowchart: ['Login Flow', 'Order Processing', 'CI/CD Pipeline', 'Payment Flow', 'Onboarding'],
  mindmap: ['System Design', 'Project Planning', 'Architecture Overview', 'Tech Stack'],
  sequence: ['API Request', 'Auth Flow', 'Order Sequence', 'Payment Processing'],
};

export function AiPromptPanel({ visible, onClose }: AiPromptPanelProps) {
  const { dispatch } = useDiagram();
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<DiagramType>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [visible]);

  // Animated close: slide out, then actually unmount
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setPrompt('');
      setLastResult(null);
      onClose();
    }, 250); // matches slide-out animation duration
  };

  const processInput = async (text: string) => {
    setIsGenerating(true);
    setLastResult(null);

    // ── Step 1: Try LLM generation ──────────────────────────────────────────
    try {
      const result = await API.generateDiagram(text, activeTab);
      if (result.nodes && result.nodes.length > 0) {
        const data = buildDiagram(result.nodes, result.connections || []);
        if (data.nodes.length > 0) {
          dispatch({ type: 'LOAD_DIAGRAM', payload: { data, id: '', name: text.slice(0, 50) } });
          setLastResult(`Generated diagram with ${data.nodes.length} components, ${data.connections.length} connections`);
          setTimeout(() => window.dispatchEvent(new CustomEvent('archflow-fit-screen')), 200);
          setTimeout(() => handleClose(), 1200);
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // LLM unavailable or not configured — fall through to pattern matching
    }

    // ── Step 2: Fallback — pattern-based generation ──────────────────────────
    setTimeout(() => {
      const parsed = parsePrompt(text, activeTab);

      if (parsed.domainTemplate) {
        const dt = parsed.domainTemplate;
        const data = dt.generate();
        dispatch({ type: 'LOAD_DIAGRAM', payload: { data, id: '', name: dt.name } });
        setLastResult(`Generated "${dt.name}" — ${data.nodes.length} components, ${data.connections.length} connections`);
        setTimeout(() => window.dispatchEvent(new CustomEvent('archflow-fit-screen')), 200);
        // Auto-close panel after successful generation so user can see the diagram
        setTimeout(() => handleClose(), 1200);
      } else if (parsed.template) {
        const tmpl = ARCH_TEMPLATES[parsed.template];
        const data = tmpl.generate();
        dispatch({ type: 'LOAD_DIAGRAM', payload: { data, id: '', name: tmpl.description } });
        setLastResult(`Generated "${tmpl.description}" — ${data.nodes.length} components, ${data.connections.length} connections`);
        setTimeout(() => window.dispatchEvent(new CustomEvent('archflow-fit-screen')), 200);
        setTimeout(() => handleClose(), 1200);
      } else if (parsed.nodes.length > 0) {
        const data = layoutNodes(parsed.nodes);
        dispatch({ type: 'LOAD_DIAGRAM', payload: { data, id: '', name: 'AI Generated Diagram' } });
        setLastResult(`Generated diagram with ${parsed.nodes.length} components`);
        setTimeout(() => window.dispatchEvent(new CustomEvent('archflow-fit-screen')), 200);
        setTimeout(() => handleClose(), 1200);
      } else {
        setLastResult('Could not match your description. Try using industry terms or technology names.');
      }

      setIsGenerating(false);
    }, 300);
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    processInput(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!visible) return null;

  return (
    <div className={`ai-panel-side ${isClosing ? 'closing' : ''}`} onClick={(e) => { if ((e.target as HTMLElement).classList.contains('ai-panel-side')) handleClose(); }}>
      <div className="ai-panel">
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-header-left">
            <span className="ai-panel-icon">✨</span>
            <span className="ai-panel-title">AI Diagram Generator</span>
          </div>
          <button className="ai-panel-close" onClick={handleClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="ai-panel-tabs">
          {DIAGRAM_TABS.map(tab => (
            <button
              key={tab.key}
              className={`ai-panel-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setLastResult(null); }}
            >
              <span className="ai-tab-icon">{tab.icon}</span>
              <span className="ai-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="ai-panel-body">
          {/* Text area */}
          <div className="ai-panel-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="ai-panel-textarea"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={TAB_PLACEHOLDERS[activeTab]}
              rows={4}
            />
          </div>

          {/* Quick suggestion chips */}
          <div className="ai-panel-chips">
            {TAB_SUGGESTIONS[activeTab].map(s => (
              <button
                key={s}
                className="ai-panel-chip"
                onClick={() => {
                  setPrompt(s);
                  processInput(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Result message */}
          {lastResult && (
            <div className={`ai-panel-result ${lastResult.startsWith('Could not') ? 'error' : 'success'}`}>
              {lastResult.startsWith('Could not') ? '⚠️' : '✅'} {lastResult}
            </div>
          )}
        </div>

        {/* Footer with Create button */}
        <div className="ai-panel-footer">
          <div className="ai-panel-footer-hint">
            Describe what you want to build and AI will generate the architecture diagram.
          </div>
          <button
            className={`ai-panel-create-btn ${isGenerating ? 'generating' : ''}`}
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="ai-spinner" />
                Generating...
              </>
            ) : (
              <>
                Create
                <span className="ai-create-shortcut">⌘ ↵</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
