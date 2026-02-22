import type { DiagramNode, Connection, StickyNote, PortPosition, DiagramData } from '@/types';
import { CT } from '@/store/constants';

interface NodeLayout {
  type: string;
  x: number;
  y: number;
}

type ConnDef = [number, PortPosition, number, PortPosition, string];
type NoteDef = [string, number, number, string];

function buildTemplate(
  layout: NodeLayout[],
  conns: ConnDef[],
  notes?: NoteDef[]
): Partial<DiagramData> {
  let nodeId = 0;
  let connId = 0;
  let noteId = 0;

  const nodes: DiagramNode[] = layout.map(l => {
    const ct = CT[l.type];
    if (!ct) throw new Error(`Unknown type: ${l.type}`);
    nodeId++;
    return {
      id: nodeId,
      type: l.type,
      x: l.x,
      y: l.y,
      icon: ct.icon,
      title: ct.title,
      desc: ct.desc,
      badge: ct.badge,
      color: ct.color,
    };
  });

  const connections: Connection[] = conns.map(([fi, fp, ti, tp, label]) => {
    connId++;
    const fromNode = nodes[fi];
    return {
      id: connId,
      from: nodes[fi].id,
      fromPort: fp,
      to: nodes[ti].id,
      toPort: tp,
      color: fromNode?.color || 'blue',
      label,
      direction: 'forward' as const,
    };
  });

  const stickyNotes: StickyNote[] = (notes || []).map(([color, x, y, text]) => {
    noteId++;
    return {
      id: noteId,
      x, y,
      color: color as any,
      text,
      width: 200,
      height: 150,
    };
  });

  return {
    nodes,
    connections,
    stickyNotes,
    canvasImages: [],
    nodeIdCounter: nodeId,
    connectionIdCounter: connId,
    noteIdCounter: noteId,
    imageIdCounter: 0,
  };
}

export function getTemplateData(name: string): Partial<DiagramData> | null {
  switch (name) {
    case 'blank':
      return { nodes: [], connections: [], stickyNotes: [], canvasImages: [], nodeIdCounter: 0, connectionIdCounter: 0, noteIdCounter: 0, imageIdCounter: 0 };

    case 'persistent-db':
      return buildTemplate(
        [{ type: 'browser', x: 500, y: 100 }, { type: 'mobile', x: 750, y: 100 }, { type: 'cdn', x: 250, y: 100 },
         { type: 'load-balancer', x: 600, y: 300 }, { type: 'api-gateway', x: 600, y: 480 },
         { type: 'auth', x: 300, y: 480 }, { type: 'server', x: 450, y: 660 }, { type: 'microservice', x: 750, y: 660 },
         { type: 'redis', x: 250, y: 660 }, { type: 'kafka', x: 950, y: 660 },
         { type: 'postgres', x: 450, y: 870 }, { type: 'mongodb', x: 700, y: 870 }, { type: 's3', x: 950, y: 870 },
         { type: 'monitoring', x: 100, y: 870 }, { type: 'logging', x: 1150, y: 660 }],
        [[0, 'bottom', 3, 'top', 'HTTPS'], [1, 'bottom', 3, 'top', 'HTTPS'], [2, 'bottom', 3, 'left', 'Static Assets'],
         [3, 'bottom', 4, 'top', 'Route'], [4, 'left', 5, 'right', 'Auth Check'],
         [4, 'bottom', 6, 'top', 'REST API'], [4, 'bottom', 7, 'top', 'gRPC'],
         [6, 'left', 8, 'right', 'Cache R/W'], [7, 'right', 9, 'left', 'Events'],
         [6, 'bottom', 10, 'top', 'SQL Query'], [7, 'bottom', 11, 'top', 'Documents'],
         [9, 'bottom', 12, 'top', 'Files'], [8, 'bottom', 13, 'top', 'Metrics'], [9, 'right', 14, 'left', 'Logs']],
        [['yellow', 70, 100, 'Persistent Database Architecture\n\nAll data flows through the API Gateway.\nPostgreSQL for structured data.\nMongoDB for documents.\nS3 for file storage.'],
         ['blue', 1100, 100, 'Data Flow\n\n1. Client > Load Balancer\n2. LB > API Gateway\n3. Gateway > Services\n4. Services > Databases\n5. Kafka for async events']]
      );

    case 'microservices':
      return buildTemplate(
        [{ type: 'browser', x: 550, y: 80 }, { type: 'mobile', x: 800, y: 80 },
         { type: 'load-balancer', x: 650, y: 260 }, { type: 'api-gateway', x: 650, y: 440 },
         { type: 'auth', x: 300, y: 440 },
         { type: 'microservice', x: 250, y: 650 }, { type: 'microservice', x: 500, y: 650 },
         { type: 'microservice', x: 750, y: 650 }, { type: 'microservice', x: 1000, y: 650 },
         { type: 'kafka', x: 600, y: 850 },
         { type: 'postgres', x: 200, y: 880 }, { type: 'mongodb', x: 450, y: 880 },
         { type: 'mysql', x: 700, y: 880 }, { type: 'redis', x: 1000, y: 880 },
         { type: 'monitoring', x: 1200, y: 440 }, { type: 'logging', x: 1200, y: 650 }],
        [[0, 'bottom', 2, 'top', 'HTTPS'], [1, 'bottom', 2, 'top', 'HTTPS'],
         [2, 'bottom', 3, 'top', 'Route'], [3, 'left', 4, 'right', 'Verify JWT'],
         [3, 'bottom', 5, 'top', 'Users API'], [3, 'bottom', 6, 'top', 'Orders API'],
         [3, 'bottom', 7, 'top', 'Products API'], [3, 'bottom', 8, 'top', 'Payments API'],
         [5, 'bottom', 10, 'top', 'SQL'], [6, 'bottom', 11, 'top', 'Documents'],
         [7, 'bottom', 12, 'top', 'SQL'], [8, 'right', 13, 'left', 'Session'],
         [5, 'bottom', 9, 'top', 'Events'], [6, 'bottom', 9, 'top', 'Events'],
         [7, 'bottom', 9, 'top', 'Events'], [3, 'right', 14, 'left', 'Metrics'],
         [9, 'right', 15, 'left', 'Logs']],
        [['yellow', 60, 80, 'Microservices Architecture\n\nEach service owns its database.\nKafka for inter-service events.\nAPI Gateway handles routing.'],
         ['green', 60, 650, 'Services\n\nUser Service > PostgreSQL\nOrder Service > MongoDB\nProduct Service > MySQL\nPayment Service > Redis cache']]
      );

    case 'event-driven':
      return buildTemplate(
        [{ type: 'browser', x: 150, y: 100 }, { type: 'mobile', x: 400, y: 100 }, { type: 'iot', x: 650, y: 100 },
         { type: 'api-gateway', x: 350, y: 300 },
         { type: 'kafka', x: 350, y: 500 }, { type: 'kafka', x: 650, y: 500 },
         { type: 'microservice', x: 100, y: 700 }, { type: 'microservice', x: 350, y: 700 },
         { type: 'microservice', x: 600, y: 700 }, { type: 'serverless', x: 850, y: 700 },
         { type: 'postgres', x: 100, y: 920 }, { type: 'mongodb', x: 350, y: 920 },
         { type: 's3', x: 600, y: 920 }, { type: 'analytics', x: 850, y: 920 },
         { type: 'monitoring', x: 900, y: 300 }],
        [[0, 'bottom', 3, 'top', 'Events'], [1, 'bottom', 3, 'top', 'Events'], [2, 'bottom', 5, 'top', 'Telemetry'],
         [3, 'bottom', 4, 'top', 'Publish'],
         [4, 'bottom', 6, 'top', 'Consume'], [4, 'bottom', 7, 'top', 'Consume'],
         [5, 'bottom', 8, 'top', 'Consume'], [5, 'bottom', 9, 'top', 'Trigger'],
         [6, 'bottom', 10, 'top', 'Write'], [7, 'bottom', 11, 'top', 'Store'],
         [8, 'bottom', 12, 'top', 'Archive'], [9, 'bottom', 13, 'top', 'Analyze'],
         [3, 'right', 14, 'left', 'Health']],
        [['yellow', 60, 300, 'Event-Driven Architecture\n\nProducers publish events to Kafka topics.\nConsumers process events independently.\nFully decoupled & scalable.'],
         ['blue', 900, 100, 'Event Flow\n\n1. Producers emit events\n2. Kafka buffers & routes\n3. Consumers process async\n4. Results persisted to DBs']]
      );

    case 'serverless':
      return buildTemplate(
        [{ type: 'browser', x: 500, y: 80 }, { type: 'mobile', x: 750, y: 80 },
         { type: 'cdn', x: 300, y: 80 }, { type: 'dns', x: 100, y: 80 },
         { type: 'api-gateway', x: 580, y: 300 },
         { type: 'auth', x: 300, y: 300 },
         { type: 'serverless', x: 350, y: 500 }, { type: 'serverless', x: 580, y: 500 },
         { type: 'serverless', x: 810, y: 500 },
         { type: 'mongodb', x: 350, y: 720 }, { type: 's3', x: 580, y: 720 },
         { type: 'redis', x: 810, y: 720 },
         { type: 'kafka', x: 580, y: 920 },
         { type: 'analytics', x: 350, y: 920 }, { type: 'monitoring', x: 810, y: 920 }],
        [[3, 'right', 2, 'left', 'Resolve'], [2, 'right', 0, 'left', 'CDN Cache'],
         [0, 'bottom', 4, 'top', 'API Call'], [1, 'bottom', 4, 'top', 'API Call'],
         [4, 'left', 5, 'right', 'Authorize'],
         [4, 'bottom', 6, 'top', 'GET /users'], [4, 'bottom', 7, 'top', 'POST /data'],
         [4, 'bottom', 8, 'top', 'GET /files'],
         [6, 'bottom', 9, 'top', 'Query'], [7, 'bottom', 10, 'top', 'Upload'],
         [8, 'bottom', 11, 'top', 'Cache Check'],
         [6, 'bottom', 12, 'top', 'Events'], [7, 'bottom', 12, 'top', 'Events'],
         [12, 'left', 13, 'top', 'Metrics'], [12, 'right', 14, 'top', 'Alerts']],
        [['yellow', 60, 80, 'Serverless Architecture\n\nNo servers to manage.\nAuto-scaling Lambda functions.\nPay per invocation.'],
         ['green', 950, 300, 'Benefits\n\nZero infrastructure management\nAutomatic scaling\nPay-per-use pricing\nFast deployment']]
      );

    case 'cicd':
      return buildTemplate(
        [{ type: 'logging', x: 100, y: 400 }, { type: 'server', x: 350, y: 400 },
         { type: 'search', x: 600, y: 400 }, { type: 'serverless', x: 850, y: 400 },
         { type: 'monitoring', x: 1100, y: 400 },
         { type: 'redis', x: 100, y: 600 }, { type: 's3', x: 350, y: 600 },
         { type: 'postgres', x: 600, y: 600 },
         { type: 'analytics', x: 850, y: 600 }, { type: 'logging', x: 1100, y: 600 }],
        [[0, 'right', 1, 'left', 'Push Code'], [1, 'right', 2, 'left', 'Run Tests'],
         [2, 'right', 3, 'left', 'Build Artifact'], [3, 'right', 4, 'left', 'Deploy'],
         [0, 'bottom', 5, 'top', 'Config'], [1, 'bottom', 6, 'top', 'Artifacts'],
         [2, 'bottom', 7, 'top', 'Test Results'],
         [3, 'bottom', 8, 'top', 'Metrics'], [4, 'bottom', 9, 'top', 'Alerts']],
        [['yellow', 100, 200, 'CI/CD Pipeline\n\nAutomated build, test, and deploy.\nEvery push triggers the pipeline.\nFast feedback loops.'],
         ['blue', 700, 200, 'Pipeline Stages\n\n1. Git Push > Trigger\n2. Build > Compile & Lint\n3. Test > Unit + Integration\n4. Package > Docker/Artifact\n5. Deploy > Staging > Prod']]
      );

    case 'data-pipeline':
      return buildTemplate(
        [{ type: 'iot', x: 100, y: 300 }, { type: 'browser', x: 100, y: 500 }, { type: 'mobile', x: 100, y: 700 },
         { type: 'kafka', x: 400, y: 500 },
         { type: 'server', x: 650, y: 350 }, { type: 'serverless', x: 650, y: 650 },
         { type: 's3', x: 900, y: 500 },
         { type: 'postgres', x: 1150, y: 350 }, { type: 'mongodb', x: 1150, y: 650 },
         { type: 'analytics', x: 1400, y: 500 }, { type: 'monitoring', x: 1400, y: 300 }],
        [[0, 'right', 3, 'left', 'Stream'], [1, 'right', 3, 'left', 'Events'], [2, 'right', 3, 'left', 'Logs'],
         [3, 'right', 4, 'left', 'Batch Process'], [3, 'right', 5, 'left', 'Real-time'],
         [4, 'right', 6, 'top', 'Transform'], [5, 'right', 6, 'bottom', 'Stage'],
         [6, 'right', 7, 'left', 'Structured'], [6, 'right', 8, 'left', 'Unstructured'],
         [7, 'right', 9, 'left', 'Dashboard'], [8, 'right', 9, 'left', 'Reports'],
         [9, 'top', 10, 'bottom', 'Alerts']],
        [['yellow', 100, 100, 'Data Pipeline\n\nIngest from multiple sources.\nStream + batch processing.\nData lake for storage.\nAnalytics dashboard.'],
         ['green', 1350, 100, 'Data Flow\n\nSources > Kafka > Process\nProcess > Data Lake\nLake > Warehouse\nWarehouse > Dashboard']]
      );

    case 'basic-webapp':
      return buildTemplate(
        [{ type: 'browser', x: 500, y: 100 }, { type: 'cdn', x: 250, y: 100 },
         { type: 'dns', x: 250, y: 300 },
         { type: 'load-balancer', x: 500, y: 300 },
         { type: 'server', x: 400, y: 500 }, { type: 'server', x: 700, y: 500 },
         { type: 'redis', x: 250, y: 700 },
         { type: 'postgres', x: 550, y: 700 },
         { type: 's3', x: 850, y: 700 }],
        [[0, 'bottom', 3, 'top', 'HTTPS'], [1, 'bottom', 2, 'top', 'Resolve'],
         [2, 'right', 3, 'left', 'Route'],
         [3, 'bottom', 4, 'top', 'App 1'], [3, 'bottom', 5, 'top', 'App 2'],
         [4, 'bottom', 6, 'left', 'Session'], [4, 'bottom', 7, 'top', 'Queries'],
         [5, 'bottom', 7, 'top', 'Queries'], [5, 'bottom', 8, 'top', 'Uploads']],
        [['yellow', 60, 100, 'Basic Web App\n\nSimple 3-tier architecture.\nLoad balanced app servers.\nPostgreSQL + Redis + S3.'],
         ['blue', 850, 100, 'Layers\n\n1. Client (Browser + CDN)\n2. Network (DNS + LB)\n3. Application (2x servers)\n4. Data (DB + Cache + Storage)']]
      );

    case 'mind-map':
      return buildTemplate(
        [{ type: 'server', x: 600, y: 450 },
         { type: 'microservice', x: 300, y: 200 }, { type: 'microservice', x: 900, y: 200 },
         { type: 'microservice', x: 300, y: 700 }, { type: 'microservice', x: 900, y: 700 },
         { type: 'serverless', x: 50, y: 100 }, { type: 'serverless', x: 50, y: 320 },
         { type: 'serverless', x: 1150, y: 100 }, { type: 'serverless', x: 1150, y: 320 },
         { type: 'serverless', x: 50, y: 600 }, { type: 'serverless', x: 50, y: 820 },
         { type: 'serverless', x: 1150, y: 600 }, { type: 'serverless', x: 1150, y: 820 }],
        [[0, 'top', 1, 'bottom', 'Branch 1'], [0, 'top', 2, 'bottom', 'Branch 2'],
         [0, 'bottom', 3, 'top', 'Branch 3'], [0, 'bottom', 4, 'top', 'Branch 4'],
         [1, 'left', 5, 'right', 'Sub-idea'], [1, 'left', 6, 'right', 'Sub-idea'],
         [2, 'right', 7, 'left', 'Sub-idea'], [2, 'right', 8, 'left', 'Sub-idea'],
         [3, 'left', 9, 'right', 'Sub-idea'], [3, 'left', 10, 'right', 'Sub-idea'],
         [4, 'right', 11, 'left', 'Sub-idea'], [4, 'right', 12, 'left', 'Sub-idea']],
        [['yellow', 520, 350, 'CENTRAL IDEA\n\nDouble-click any node title\nto rename it.\nThis is your main topic.'],
         ['pink', 50, 450, 'Tips\n\nDrag nodes to rearrange.\nPress C to add connections.\nPress N for more notes.']]
      );

    case 'swimlanes':
      return buildTemplate(
        [{ type: 'browser', x: 350, y: 100 }, { type: 'cdn', x: 600, y: 100 }, { type: 'dns', x: 850, y: 100 },
         { type: 'api-gateway', x: 350, y: 350 }, { type: 'server', x: 600, y: 350 },
         { type: 'postgres', x: 850, y: 350 }, { type: 'redis', x: 1100, y: 350 },
         { type: 'logging', x: 350, y: 600 }, { type: 'server', x: 600, y: 600 },
         { type: 's3', x: 850, y: 600 }, { type: 'monitoring', x: 1100, y: 600 },
         { type: 'search', x: 350, y: 850 }, { type: 'analytics', x: 600, y: 850 },
         { type: 'logging', x: 850, y: 850 }],
        [[0, 'right', 1, 'left', 'Build'], [1, 'right', 2, 'left', 'Deploy'],
         [3, 'right', 4, 'left', 'Process'], [4, 'right', 5, 'left', 'Persist'],
         [4, 'right', 6, 'left', 'Cache'],
         [7, 'right', 8, 'left', 'Build'], [8, 'right', 9, 'left', 'Artifact'],
         [9, 'right', 10, 'left', 'Monitor'],
         [11, 'right', 12, 'left', 'Analyze'], [12, 'right', 13, 'left', 'Report'],
         [2, 'bottom', 3, 'top', 'API Call'], [4, 'bottom', 8, 'top', 'Deploy'],
         [10, 'bottom', 11, 'top', 'Alerts']],
        [['blue', 50, 100, 'FRONTEND TEAM\n\nUI Components\nUser Interactions\nClient-side Logic'],
         ['green', 50, 350, 'BACKEND TEAM\n\nAPI Endpoints\nBusiness Logic\nData Processing'],
         ['pink', 50, 600, 'DEVOPS TEAM\n\nCI/CD\nInfrastructure\nMonitoring'],
         ['yellow', 50, 850, 'QA TEAM\n\nTest Plans\nAutomation\nBug Reports'],
         ['yellow', 1200, 100, 'Swimlane Process Flow\n\nEach row = one team.\nHorizontal = process steps.\nVertical = handoffs between teams.']]
      );

    case 'kanban':
      return buildKanbanTemplate();

    default:
      return null;
  }
}

function buildKanbanTemplate(): Partial<DiagramData> {
  // Column layout: 4 groups side by side
  const colWidth = 280;
  const colHeight = 520;
  const colGap = 40;
  const startX = 100;
  const startY = 100;
  const nodeW = 170;
  const nodePadX = 55; // center node in column
  const nodeStartY = 60; // offset from column top
  const nodeGap = 130;

  // Groups (kanban columns)
  const groups: any[] = [
    { id: 1, x: startX, y: startY, width: colWidth, height: colHeight, color: 'blue', title: '📋 Backlog', childNodeIds: [1, 2, 3], childNoteIds: [] },
    { id: 2, x: startX + colWidth + colGap, y: startY, width: colWidth, height: colHeight, color: 'orange', title: '🔨 In Progress', childNodeIds: [4, 5], childNoteIds: [] },
    { id: 3, x: startX + (colWidth + colGap) * 2, y: startY, width: colWidth, height: colHeight, color: 'purple', title: '🔍 Review', childNodeIds: [6], childNoteIds: [] },
    { id: 4, x: startX + (colWidth + colGap) * 3, y: startY, width: colWidth, height: colHeight, color: 'green', title: '✅ Done', childNodeIds: [7, 8], childNoteIds: [] },
  ];

  // Task nodes inside columns
  const makeNode = (id: number, colIdx: number, rowIdx: number, type: string, title: string, desc: string) => {
    const ct = CT[type];
    return {
      id,
      type,
      x: groups[colIdx].x + nodePadX,
      y: groups[colIdx].y + nodeStartY + rowIdx * nodeGap,
      icon: ct.icon,
      title,
      desc,
      badge: ct.badge,
      color: ct.color,
    };
  };

  const nodes: DiagramNode[] = [
    // Backlog (col 0)
    makeNode(1, 0, 0, 'logging', 'Setup Logging', 'Add structured logs'),
    makeNode(2, 0, 1, 'search', 'Search Feature', 'Full-text search'),
    makeNode(3, 0, 2, 'analytics', 'Analytics Dashboard', 'User metrics'),
    // In Progress (col 1)
    makeNode(4, 1, 0, 'server', 'API Endpoints', 'REST + GraphQL'),
    makeNode(5, 1, 1, 'auth', 'Auth System', 'OAuth2 + JWT'),
    // Review (col 2)
    makeNode(6, 2, 0, 'postgres', 'Database Schema', 'Migration v2'),
    // Done (col 3)
    makeNode(7, 3, 0, 'browser', 'Landing Page', 'Responsive UI'),
    makeNode(8, 3, 1, 'cdn', 'CDN Setup', 'CloudFront config'),
  ];

  // Connections showing task flow / dependencies
  const connections: Connection[] = [
    { id: 1, from: 4, fromPort: 'right' as PortPosition, to: 6, toPort: 'left' as PortPosition, color: 'purple', label: 'Review', direction: 'forward' as const },
    { id: 2, from: 6, fromPort: 'right' as PortPosition, to: 7, toPort: 'left' as PortPosition, color: 'green', label: 'Approved', direction: 'forward' as const },
    { id: 3, from: 5, fromPort: 'bottom' as PortPosition, to: 6, toPort: 'bottom' as PortPosition, color: 'purple', label: 'Next', direction: 'forward' as const },
  ];

  const stickyNotes: StickyNote[] = [
    { id: 1, x: startX, y: startY - 80, color: 'yellow' as any, text: 'Kanban Board\n\nDrag tasks between columns.\nDouble-click to edit titles.\nUse Ctrl+A to select all.', width: 280, height: 70 },
    { id: 2, x: startX + (colWidth + colGap) * 3, y: startY + colHeight + 20, color: 'green' as any, text: 'Sprint Progress: 5/8 tasks\n62% complete 🚀', width: 280, height: 70 },
  ];

  return {
    nodes,
    connections,
    stickyNotes,
    canvasImages: [],
    groups,
    nodeIdCounter: 8,
    connectionIdCounter: 3,
    noteIdCounter: 2,
    imageIdCounter: 0,
    groupIdCounter: 4,
  };
}

export const TEMPLATE_NAMES: Record<string, string> = {
  'persistent-db': 'Persistent Database',
  'microservices': 'Microservices',
  'event-driven': 'Event-Driven',
  'serverless': 'Serverless',
  'cicd': 'CI/CD Pipeline',
  'data-pipeline': 'Data Pipeline',
  'basic-webapp': 'Basic Web App',
  'mind-map': 'Mind Map',
  'swimlanes': 'Swimlanes',
  'kanban': 'Kanban Board',
  'blank': 'Blank Canvas',
};
