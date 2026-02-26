const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// =============================================
// Valid CT node types (must match constants.ts)
// =============================================
const VALID_TYPES = new Set([
  'browser', 'mobile', 'desktop', 'iot',
  'api-gateway', 'load-balancer', 'cdn', 'dns',
  'server', 'microservice', 'serverless', 'auth',
  'graphql', 'supergraph', 'subgraph',
  'postgres', 'mongodb', 'mysql', 's3',
  'redis', 'memcached', 'kafka', 'rabbitmq',
  'monitoring', 'logging', 'analytics', 'search',
]);

// Map common LLM type variants → valid types
const TYPE_ALIASES = {
  // browser variants
  'web': 'browser', 'frontend': 'browser', 'spa': 'browser', 'web-app': 'browser',
  'webapp': 'browser', 'web-browser': 'browser', 'react': 'browser', 'vue': 'browser',
  'angular': 'browser', 'next.js': 'browser', 'nextjs': 'browser', 'client': 'browser',
  'micro-frontend': 'browser', 'microfrontend': 'browser', 'mfe': 'browser',
  'shell-app': 'browser', 'host-app': 'browser', 'remote-app': 'browser',
  // mobile variants
  'ios': 'mobile', 'android': 'mobile', 'react-native': 'mobile', 'flutter': 'mobile',
  // auth variants
  'authentication': 'auth', 'authorization': 'auth', 'identity-provider': 'auth',
  'idp': 'auth', 'oauth': 'auth', 'oidc': 'auth', 'sso': 'auth', 'keycloak': 'auth',
  'auth-service': 'auth', 'auth-server': 'auth', 'authorization-server': 'auth',
  // gateway variants
  'gateway': 'api-gateway', 'api': 'api-gateway', 'reverse-proxy': 'api-gateway',
  'nginx': 'api-gateway', 'kong': 'api-gateway', 'traefik': 'api-gateway',
  // server variants
  'backend': 'server', 'rest-api': 'server', 'service': 'server', 'app-server': 'server',
  'bff': 'server', 'backend-for-frontend': 'server', 'node': 'server',
  // microservice variants
  'micro-service': 'microservice', 'bounded-context': 'microservice',
  // serverless variants
  'lambda': 'serverless', 'function': 'serverless', 'cloud-function': 'serverless',
  'faas': 'serverless', 'azure-function': 'serverless',
  // database variants
  'database': 'postgres', 'db': 'postgres', 'sql': 'postgres', 'rdbms': 'postgres',
  'relational-db': 'postgres', 'postgresql': 'postgres',
  'nosql': 'mongodb', 'document-db': 'mongodb', 'mongo': 'mongodb',
  'object-storage': 's3', 'blob-storage': 's3', 'storage': 's3', 'file-storage': 's3',
  // cache/queue variants
  'cache': 'redis', 'session-store': 'redis', 'token-cache': 'redis',
  'message-broker': 'rabbitmq', 'task-queue': 'rabbitmq', 'queue': 'rabbitmq',
  'event-bus': 'kafka', 'event-stream': 'kafka', 'message-bus': 'kafka',
  'event-streaming': 'kafka', 'stream': 'kafka',
  // load balancer variants
  'load-balancing': 'load-balancer', 'lb': 'load-balancer',
  // observability variants
  'metrics': 'monitoring', 'alerting': 'monitoring', 'prometheus': 'monitoring',
  'grafana': 'monitoring', 'datadog': 'monitoring',
  'logs': 'logging', 'log-aggregation': 'logging', 'elk': 'logging',
  'search-engine': 'search', 'elasticsearch': 'search', 'opensearch': 'search',
  // CDN variants
  'edge': 'cdn', 'cloudfront': 'cdn', 'content-delivery': 'cdn',
};

function normalizeType(type) {
  if (!type || typeof type !== 'string') return 'server';
  const t = type.toLowerCase().trim().replace(/\s+/g, '-');
  if (VALID_TYPES.has(t)) return t;
  if (TYPE_ALIASES[t]) return TYPE_ALIASES[t];
  // Keyword fallback
  if (t.includes('auth') || t.includes('oauth') || t.includes('identity')) return 'auth';
  if (t.includes('gateway') || t.includes('proxy')) return 'api-gateway';
  if (t.includes('micro') && t.includes('front')) return 'browser';
  if (t.includes('browser') || t.includes('frontend') || t.includes('web')) return 'browser';
  if (t.includes('mobile') || t.includes('ios') || t.includes('android')) return 'mobile';
  if (t.includes('micro')) return 'microservice';
  if (t.includes('lambda') || t.includes('serverless') || t.includes('function')) return 'serverless';
  if (t.includes('kafka') || t.includes('rabbit') || t.includes('queue') || t.includes('bus')) return 'kafka';
  if (t.includes('redis') || t.includes('cache')) return 'redis';
  if (t.includes('postgres') || t.includes('sql') || t.includes('database') || t.includes('db')) return 'postgres';
  if (t.includes('mongo')) return 'mongodb';
  if (t.includes('s3') || t.includes('storage') || t.includes('blob')) return 's3';
  if (t.includes('cdn') || t.includes('edge')) return 'cdn';
  if (t.includes('monitor') || t.includes('metric') || t.includes('observ')) return 'monitoring';
  if (t.includes('log')) return 'logging';
  if (t.includes('search') || t.includes('elastic')) return 'search';
  if (t.includes('load') || t.includes('balancer')) return 'load-balancer';
  return 'server'; // safe default
}

// =============================================
// Architecture node types available in ArchFlow
// =============================================
const ARCH_NODE_TYPES = `
Available node types — you MUST use ONLY these exact "type" string values, nothing else:

CLIENT LAYER:
- browser  (Web Browser, SPA, React/Vue/Angular app, micro-frontend, shell app)
- mobile   (iOS / Android / React Native / Flutter app)
- desktop  (Electron, native desktop app)
- iot      (IoT Device, sensor, edge device)

NETWORK / GATEWAY:
- api-gateway   (API Gateway, BFF, reverse proxy, Kong, Nginx)
- load-balancer (Load Balancer, traffic distribution, HAProxy)
- cdn           (CDN, edge caching, CloudFront)
- dns           (DNS, domain resolution)

APPLICATION SERVERS:
- server       (App Server, REST API, BFF service, Node/Express/Django)
- microservice (Microservice, bounded-context service)
- serverless   (Serverless Function, Lambda, Cloud Function, FaaS)
- auth         (Auth Service, OAuth2/OIDC Authorization Server, Identity Provider, Keycloak, Auth0)

GRAPHQL:
- graphql    (GraphQL API endpoint)
- supergraph (Apollo Router, federated gateway)
- subgraph   (Federated service / subgraph)

DATABASE / STORAGE:
- postgres  (PostgreSQL, relational SQL database)
- mongodb   (MongoDB, document NoSQL database)
- mysql     (MySQL, MariaDB)
- s3        (Object Store, S3, Blob Storage, file storage)

CACHE / QUEUE / MESSAGING:
- redis    (Redis, in-memory cache, session store, token cache, pub/sub)
- memcached(Memcached, distributed cache)
- kafka    (Apache Kafka, event streaming, event bus, message bus)
- rabbitmq (RabbitMQ, message broker, task queue)

OBSERVABILITY:
- monitoring (Prometheus, Grafana, Datadog — metrics & alerts)
- logging    (ELK Stack, CloudWatch, Splunk — log aggregation)
- analytics  (Analytics dashboards, data insights)
- search     (Elasticsearch, OpenSearch — full-text search)
`;

// =============================================
// System prompt for architecture diagram generation
// =============================================
const SYSTEM_PROMPT = `You are an expert software architect. Generate detailed architecture diagrams as structured JSON.

${ARCH_NODE_TYPES}

LAYOUT GUIDELINES:
- Arrange nodes logically: clients on the left, backends in the middle, databases on the right
- Use x/y coordinates (pixels). Canvas is ~1400px wide × 900px tall
- Typical spacing: 250px horizontal, 180px vertical between nodes
- Start clients at x=80-150, gateways at x=350-450, services at x=600-750, databases at x=950-1100
- Stagger y positions so nodes don't overlap (base y=150, increment by 180-200 per row)
- For large diagrams (10+ nodes) use more vertical space, up to y=1200

ARCHITECTURE PATTERNS:
- OAuth 2.0 / OIDC + SPA: browser (SPA shell) → api-gateway → auth (Authorization Server) → redis (Token Cache) + postgres (User Registry); browser → api-gateway (Resource Server) → microservice(s)
- Micro-frontends: Multiple browser nodes (Shell App + Remote Apps) → api-gateway → microservices → separate databases per service
- Microservices: load-balancer → api-gateway → multiple microservices → separate databases per service
- Event-driven: kafka or rabbitmq as central bus between producers and consumers
- CQRS: Separate read (redis/elasticsearch) and write (postgres) paths
- Serverless: api-gateway → serverless functions → s3/postgres/mongodb
- BFF (Backend for Frontend): Separate server node per client type (mobile BFF, web BFF)
- Zero Trust: auth at every layer, api-gateway validates tokens on every request

CONNECTION FORMAT: connections is an array of [fromIndex, toIndex, label] triples (0-based node indices).
- The label describes what flows between the two nodes — use it to show request/response details, protocols, API endpoints, or data descriptions.
- Examples: "POST /api/login {email, password}", "JWT access_token", "GET /products → Product[]", "Pub: order.created", "TCP :5432 SQL queries", "gRPC GetUser(userId)"

NODE DESCRIPTIONS:
- Each node MUST have a "desc" field with a specific, contextual description — NOT generic text.
- The desc should explain the node's role, key APIs, tech stack, or data it handles in this specific architecture.
- Examples: "React SPA — handles routing, auth state, API calls via Axios", "Validates JWT, rate limits 1000 req/min, routes to upstream services", "Stores user profiles, sessions, roles — pgBouncer pooling"

CRITICAL RULES:
1. ONLY use the exact type strings listed above — NEVER invent types like "micro-frontend", "spa", "web-app", "react-app", "identity-provider", etc.
2. If you want a micro-frontend → use type "browser"
3. If you want an identity provider / OAuth server → use type "auth"
4. If you want a BFF → use type "server"
5. Give each node a descriptive title (e.g., "Shell App", "Product Remote", "Auth Server", "Token Cache")
6. Aim for 8-15 nodes — enough detail to be useful
7. Return ONLY valid JSON — no markdown fences, no explanation
8. Every node MUST include a "desc" field with specific technical details relevant to the architecture
9. Every connection MUST include a label describing the data flow, protocol, or API endpoint

OUTPUT FORMAT (strict JSON, no markdown):
{
  "nodes": [
    { "type": "browser", "title": "Shell App (SPA)", "desc": "React 18 SPA — module federation host, handles auth state & routing", "x": 100, "y": 150 },
    { "type": "browser", "title": "Product MFE", "desc": "Remote micro-frontend — product catalog, search, filtering UI", "x": 100, "y": 340 },
    { "type": "api-gateway", "title": "API Gateway", "desc": "Kong Gateway — JWT validation, rate limiting, request routing", "x": 400, "y": 250 },
    { "type": "auth", "title": "Auth Server (OIDC)", "desc": "Keycloak OIDC Provider — issues JWT, manages user sessions & roles", "x": 700, "y": 150 }
  ],
  "connections": [[0, 2, "GET /api/* with Bearer token"], [1, 2, "GET /api/products?q={query}"], [2, 3, "POST /token/introspect {access_token}"]]
}`;

// =============================================
// POST /api/ai/generate — Generate diagram via LLM
// =============================================
router.post('/api/ai/generate', requireAuth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI generation not configured (ANTHROPIC_API_KEY missing)' });
  }

  const { prompt, diagramType } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = diagramType && diagramType !== 'auto'
    ? `Generate a ${diagramType} architecture diagram for: ${prompt}`
    : `Generate an architecture diagram for: ${prompt}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0]?.text || '';

    // Extract JSON from the response (strip any accidental markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response had no JSON:', text);
      return res.status(422).json({ error: 'AI returned an unexpected format' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('AI JSON parse error:', e.message, '\nRaw:', text);
      return res.status(422).json({ error: 'AI returned invalid JSON' });
    }

    if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      return res.status(422).json({ error: 'AI returned no nodes' });
    }

    // Normalize node types — map LLM variants to valid CT keys
    const nodes = parsed.nodes.map(node => ({
      ...node,
      type: normalizeType(node.type),
      desc: node.desc || '',
    }));

    // Normalize connections — support both [from, to] and [from, to, label] formats
    const connections = Array.isArray(parsed.connections)
      ? parsed.connections.map(c => {
          if (Array.isArray(c)) {
            return { from: c[0], to: c[1], label: c[2] || '' };
          }
          return c;
        })
      : [];

    res.json({ nodes, connections });
  } catch (e) {
    console.error('AI generation error:', e.message);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

module.exports = router;
