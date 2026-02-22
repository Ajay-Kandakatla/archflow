import { S } from './state.js';
import { API } from './api.js';
import { createNode } from './nodes.js';
import { createConnection } from './connections.js';
import { addStickyNote } from './notes.js';
import { fitToScreen } from './ui.js';
import { clearCanvasQuiet, updateDiagramNameDisplay } from './diagram.js';

export function showTemplateModal() { document.getElementById('templateModal').classList.add('visible'); }
export function hideTemplateModal() { document.getElementById('templateModal').classList.remove('visible'); }

function _addNote(color, x, y, text) {
    addStickyNote(color, x, y);
    const n = S.stickyNotes[S.stickyNotes.length - 1];
    if (n) { n.text = text; const el = document.getElementById('note-' + n.id); if (el) el.querySelector('textarea').value = text; }
}

export async function loadTemplate(name) {
    hideTemplateModal();
    const hintOverlay = document.getElementById('hintOverlay');
    hintOverlay.style.opacity = '0'; setTimeout(() => hintOverlay.style.display = 'none', 300);
    clearCanvasQuiet();

    const templateNames = {
        'persistent-db': 'Persistent Database', 'microservices': 'Microservices',
        'event-driven': 'Event-Driven', 'serverless': 'Serverless',
        'cicd': 'CI/CD Pipeline', 'data-pipeline': 'Data Pipeline',
        'basic-webapp': 'Basic Web App', 'mind-map': 'Mind Map',
        'swimlanes': 'Swimlanes', 'blank': 'Blank Canvas',
    };

    const diagramName = templateNames[name] || 'Untitled Diagram';
    try {
        const result = await API.create(diagramName, {});
        S.currentDiagramId = result._id;
        updateDiagramNameDisplay(diagramName);
        history.replaceState(null, '', '/?d=' + S.currentDiagramId);
        document.getElementById('autosaveIndicator').style.display = 'flex';
    } catch (e) { console.error('Failed to create diagram:', e); }

    if (name === 'blank') return;

    const builders = {
        'persistent-db': buildPersistentDB, 'microservices': buildMicroservices,
        'event-driven': buildEventDriven, 'serverless': buildServerless,
        'cicd': buildCICD, 'data-pipeline': buildDataPipeline,
        'basic-webapp': buildBasicWebApp, 'mind-map': buildMindMap,
        'swimlanes': buildSwimlanes,
    };
    if (builders[name]) builders[name]();
}

function _build(layout, conns, notes) {
    const cn = [];
    layout.forEach(l => { cn.push(createNode(l.type, l.x, l.y)); });
    setTimeout(() => {
        conns.forEach(([fi, fp, ti, tp, label]) => { if (cn[fi] && cn[ti]) createConnection(cn[fi].id, fp, cn[ti].id, tp, label); });
        if (notes) notes.forEach(n => _addNote(n[0], n[1], n[2], n[3]));
        fitToScreen();
    }, 150);
}

function buildPersistentDB() {
    _build(
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
}

function buildMicroservices() {
    _build(
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
}

function buildEventDriven() {
    _build(
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
}

function buildServerless() {
    _build(
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
}

function buildCICD() {
    _build(
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
}

function buildDataPipeline() {
    _build(
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
}

function buildBasicWebApp() {
    _build(
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
}

function buildMindMap() {
    clearCanvasQuiet();
    const hintOverlay = document.getElementById('hintOverlay');
    hintOverlay.style.opacity = '0'; setTimeout(() => hintOverlay.style.display = 'none', 300);

    const center = createNode('server', 600, 450);
    const b1 = createNode('microservice', 300, 200);
    const b2 = createNode('microservice', 900, 200);
    const b3 = createNode('microservice', 300, 700);
    const b4 = createNode('microservice', 900, 700);
    const s1a = createNode('serverless', 50, 100);
    const s1b = createNode('serverless', 50, 320);
    const s2a = createNode('serverless', 1150, 100);
    const s2b = createNode('serverless', 1150, 320);
    const s3a = createNode('serverless', 50, 600);
    const s3b = createNode('serverless', 50, 820);
    const s4a = createNode('serverless', 1150, 600);
    const s4b = createNode('serverless', 1150, 820);

    setTimeout(() => {
        createConnection(center.id, 'top', b1.id, 'bottom', 'Branch 1');
        createConnection(center.id, 'top', b2.id, 'bottom', 'Branch 2');
        createConnection(center.id, 'bottom', b3.id, 'top', 'Branch 3');
        createConnection(center.id, 'bottom', b4.id, 'top', 'Branch 4');
        createConnection(b1.id, 'left', s1a.id, 'right', 'Sub-idea');
        createConnection(b1.id, 'left', s1b.id, 'right', 'Sub-idea');
        createConnection(b2.id, 'right', s2a.id, 'left', 'Sub-idea');
        createConnection(b2.id, 'right', s2b.id, 'left', 'Sub-idea');
        createConnection(b3.id, 'left', s3a.id, 'right', 'Sub-idea');
        createConnection(b3.id, 'left', s3b.id, 'right', 'Sub-idea');
        createConnection(b4.id, 'right', s4a.id, 'left', 'Sub-idea');
        createConnection(b4.id, 'right', s4b.id, 'left', 'Sub-idea');

        _addNote('yellow', 520, 350, 'CENTRAL IDEA\n\nDouble-click any node title\nto rename it.\nThis is your main topic.');
        _addNote('pink', 50, 450, 'Tips\n\nDrag nodes to rearrange.\nPress C to add connections.\nPress N for more notes.');
        fitToScreen();
    }, 150);
}

function buildSwimlanes() {
    clearCanvasQuiet();
    const hintOverlay = document.getElementById('hintOverlay');
    hintOverlay.style.opacity = '0'; setTimeout(() => hintOverlay.style.display = 'none', 300);

    _addNote('blue', 50, 100, 'FRONTEND TEAM\n\nUI Components\nUser Interactions\nClient-side Logic');
    _addNote('green', 50, 350, 'BACKEND TEAM\n\nAPI Endpoints\nBusiness Logic\nData Processing');
    _addNote('pink', 50, 600, 'DEVOPS TEAM\n\nCI/CD\nInfrastructure\nMonitoring');
    _addNote('yellow', 50, 850, 'QA TEAM\n\nTest Plans\nAutomation\nBug Reports');

    const f1 = createNode('browser', 350, 100);
    const f2 = createNode('cdn', 600, 100);
    const f3 = createNode('dns', 850, 100);
    const b1 = createNode('api-gateway', 350, 350);
    const b2 = createNode('server', 600, 350);
    const b3 = createNode('postgres', 850, 350);
    const b4 = createNode('redis', 1100, 350);
    const d1 = createNode('logging', 350, 600);
    const d2 = createNode('server', 600, 600);
    const d3 = createNode('s3', 850, 600);
    const d4 = createNode('monitoring', 1100, 600);
    const q1 = createNode('search', 350, 850);
    const q2 = createNode('analytics', 600, 850);
    const q3 = createNode('logging', 850, 850);

    setTimeout(() => {
        createConnection(f1.id, 'right', f2.id, 'left', 'Build');
        createConnection(f2.id, 'right', f3.id, 'left', 'Deploy');
        createConnection(b1.id, 'right', b2.id, 'left', 'Process');
        createConnection(b2.id, 'right', b3.id, 'left', 'Persist');
        createConnection(b2.id, 'right', b4.id, 'left', 'Cache');
        createConnection(d1.id, 'right', d2.id, 'left', 'Build');
        createConnection(d2.id, 'right', d3.id, 'left', 'Artifact');
        createConnection(d3.id, 'right', d4.id, 'left', 'Monitor');
        createConnection(q1.id, 'right', q2.id, 'left', 'Analyze');
        createConnection(q2.id, 'right', q3.id, 'left', 'Report');
        createConnection(f3.id, 'bottom', b1.id, 'top', 'API Call');
        createConnection(b2.id, 'bottom', d2.id, 'top', 'Deploy');
        createConnection(d4.id, 'bottom', q1.id, 'top', 'Alerts');

        _addNote('yellow', 1200, 100, 'Swimlane Process Flow\n\nEach row = one team.\nHorizontal = process steps.\nVertical = handoffs between teams.');
        fitToScreen();
    }, 150);
}
