import React from 'react';

interface TemplateModalProps {
  visible: boolean;
  onHide: () => void;
  onLoad: (name: string) => void;
}

const TEMPLATES = [
  { category: 'Architecture Patterns', items: [
    { name: 'persistent-db', title: 'Persistent Database', desc: 'Full-stack with LB, API Gateway, cache, SQL & NoSQL databases', badge: 'Popular', accent: 'red', preview: '🌐 ⚖️ 🚪 ⚙️ 🐘' },
    { name: 'microservices', title: 'Microservices', desc: 'API Gateway with multiple services, each with its own database', badge: 'Architecture', accent: 'purple', preview: '🚪 🧩 🧩 🧩 📨' },
    { name: 'event-driven', title: 'Event-Driven', desc: 'Producers, Kafka topics, consumers, and analytics pipeline', badge: 'Async', accent: 'orange', preview: '⚡ 📨 📨 ⚙️ 📊' },
    { name: 'fullstack-api', title: 'Full-Stack API', desc: 'Client, Server & Data layers in groups with DevOps observability', badge: 'Groups', accent: 'purple', preview: '🖥️ ⚙️ 🗄️ 📊' },
  ]},
  { category: 'GraphQL & Federation', items: [
    { name: 'graphql-api', title: 'GraphQL API', desc: 'Single endpoint with resolvers, auth, subscriptions & file uploads', badge: 'GraphQL', accent: 'pink', preview: '◈ ⚙️ 🔐 ⚡' },
    { name: 'graphql-federation', title: 'Supergraph Federation', desc: 'Apollo-style federated subgraphs composed into a unified supergraph', badge: 'Federation', accent: 'purple', preview: '◉ ◇ ◇ ◇ ◇' },
  ]},
  { category: 'Cloud & DevOps', items: [
    { name: 'serverless', title: 'Serverless', desc: 'CDN, API Gateway, Lambda functions, DynamoDB, S3', badge: 'Cloud', accent: 'cyan', preview: '🌍 🚪 ⚡ ⚡ 📦' },
    { name: 'cicd', title: 'CI/CD Pipeline', desc: 'Git, Build, Test, Deploy stages with monitoring', badge: 'DevOps', accent: 'green', preview: '📝 ⚙️ 🔍 📦 📊' },
    { name: 'data-pipeline', title: 'Data Pipeline', desc: 'Ingestion, streaming, processing, data lake, dashboard', badge: 'Data', accent: 'yellow', preview: '📡 📨 ⚙️ 📦 📈' },
  ]},
  { category: 'Planning & Collaboration', items: [
    { name: 'basic-webapp', title: 'Basic Web App', desc: 'Simple 3-tier: Client, Server, Database starter', badge: 'Starter', accent: 'blue', preview: '🌐 ⚖️ ⚙️ 🐘' },
    { name: 'mind-map', title: 'Mind Map', desc: 'Central idea with radial branches for brainstorming', badge: 'Planning', accent: 'pink', preview: '💡 📝 📝 📝 📝' },
    { name: 'swimlanes', title: 'Swimlanes', desc: 'Process flow across teams: Frontend, Backend, DevOps, QA', badge: 'Process', accent: 'cyan', preview: '🏊 ⚙️ ⚙️ ⚙️' },
    { name: 'kanban', title: 'Kanban Board', desc: 'Track work with Backlog, In Progress, Review & Done columns', badge: 'Tracking', accent: 'green', preview: '📋 🔨 🔍 ✅' },
  ]},
];

export function TemplateModal({ visible, onHide, onLoad }: TemplateModalProps) {
  return (
    <div className={`template-modal-overlay ${visible ? 'visible' : ''}`} id="templateModal"
      onClick={(e) => { if (e.target === e.currentTarget) onHide(); }}>
      <div className="template-modal">
        <div className="template-modal-header">
          <div>
            <h2>Choose a Template</h2>
            <p>Start with a pre-built architecture or blank canvas</p>
          </div>
          <button className="template-modal-close" onClick={onHide}>✕</button>
        </div>
        <div className="template-modal-body">
          {TEMPLATES.map(cat => (
            <div className="template-category" key={cat.category}>
              <div className="template-category-title">{cat.category}</div>
              <div className="template-grid">
                {cat.items.map(t => (
                  <div key={t.name} className="template-card" data-accent={t.accent}>
                    <div className="template-card-preview">{t.preview}</div>
                    <div className="template-card-title">{t.title}</div>
                    <div className="template-card-desc">{t.desc}</div>
                    <span className="template-card-badge">{t.badge}</span>
                    <button className="template-use-btn" onClick={() => onLoad(t.name)}>
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="template-category">
            <div className="template-category-title">Start Fresh</div>
            <div className="template-grid">
              <div className="template-card template-card-blank" onClick={() => onLoad('blank')}>
                <div className="blank-icon">+</div>
                <div className="blank-text">Blank Canvas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
