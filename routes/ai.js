const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// =============================================
// Architecture node types available in ArchFlow
// =============================================
const ARCH_NODE_TYPES = `
Available node types (use these exact "type" values):

CLIENT LAYER:
- browser: Web Browser (client-side web app)
- mobile: Mobile App (iOS / Android)
- desktop: Desktop App (native desktop)
- iot: IoT Device (sensor / edge device)

NETWORK / GATEWAY:
- api-gateway: API Gateway (routing, auth, rate limiting)
- load-balancer: Load Balancer (traffic distribution)
- cdn: CDN (content delivery network, edge caching)
- dns: DNS (domain name resolution)

APPLICATION SERVERS:
- server: App Server (business logic, REST/gRPC service)
- microservice: Microservice (bounded-context service)
- serverless: Serverless Function (Lambda / Cloud Function / FaaS)
- auth: Auth Service (Authentication / Authorization / Identity Provider)

GRAPHQL:
- graphql: GraphQL API (query endpoint)
- supergraph: Supergraph / Apollo Router (federated gateway)
- subgraph: Subgraph (federated service)

DATABASE / STORAGE:
- postgres: PostgreSQL (relational SQL database)
- mongodb: MongoDB (document NoSQL database)
- mysql: MySQL (relational SQL database)
- s3: Object Store (S3 / Blob Storage / file storage)

CACHE / QUEUE / MESSAGING:
- redis: Redis (in-memory cache, session store, pub/sub)
- memcached: Memcached (distributed cache)
- kafka: Apache Kafka (event streaming, message bus)
- rabbitmq: RabbitMQ (message broker, task queue)

OBSERVABILITY:
- monitoring: Monitoring (Prometheus, Grafana, Datadog — metrics & alerts)
- logging: Logging (ELK Stack, CloudWatch, Splunk — log aggregation)
- analytics: Analytics (data insights, dashboards)
- search: Search (Elasticsearch, OpenSearch — full-text search)
`;

// =============================================
// System prompt for architecture diagram generation
// =============================================
const SYSTEM_PROMPT = `You are an expert software architect. Generate architecture diagrams as structured JSON.

${ARCH_NODE_TYPES}

LAYOUT GUIDELINES:
- Arrange nodes logically: clients on the left, backends in the middle, databases on the right
- Use x/y coordinates (pixels). Canvas is ~1400px wide × 800px tall
- Typical spacing: 250px horizontal, 180px vertical between nodes
- Start clients at x=80-150, gateways at x=350-450, services at x=600-750, databases at x=950-1100
- Stagger y positions so nodes don't overlap (base y=150, increment by 180-200 per row)

ARCHITECTURE PATTERNS:
- OAuth 2.0 / OIDC: Include auth service (Authorization Server), api-gateway (Resource Server), redis (token cache), postgres (user/client registry), browser/mobile (clients)
- Microservices: Use load-balancer → api-gateway → multiple microservices → separate databases per service
- Event-driven: kafka or rabbitmq as central bus between producers and consumers
- CQRS: Separate read (redis/elasticsearch) and write (postgres) paths
- Serverless: api-gateway → serverless functions → s3/postgres/mongodb
- BFF (Backend for Frontend): Separate api-gateway per client type (mobile/web)
- Zero Trust: auth at every layer, api-gateway validates tokens on every request

CONNECTION FORMAT: connections is an array of [fromIndex, toIndex] pairs (0-based node indices).

IMPORTANT RULES:
1. Only use node types from the list above — no custom types
2. Give each node a descriptive, industry-standard title (e.g., "Authorization Server", "User Service", "Product DB")
3. Aim for 5-15 nodes for most diagrams — enough to be useful without overwhelming
4. Connections should reflect actual data/request flow
5. Return ONLY valid JSON — no markdown, no explanation text

OUTPUT FORMAT (strict JSON):
{
  "nodes": [
    { "type": "browser", "title": "Web Client", "x": 100, "y": 200 },
    { "type": "api-gateway", "title": "API Gateway", "x": 400, "y": 200 }
  ],
  "connections": [[0, 1], [1, 2]]
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
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

    res.json({
      nodes: parsed.nodes,
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    });
  } catch (e) {
    console.error('AI generation error:', e.message);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

module.exports = router;
