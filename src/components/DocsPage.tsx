import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDiagram } from '@/store/DiagramContext';

// ─── Section Data ──────────────────────────────────────────────────────────────

interface DocSection {
  id: string;
  title: string;
  category: 'guide' | 'architecture';
}

const SECTIONS: DocSection[] = [
  // User Guide
  { id: 'getting-started', title: 'Getting Started', category: 'guide' },
  { id: 'adding-nodes', title: 'Adding Nodes', category: 'guide' },
  { id: 'drawing-connections', title: 'Drawing Connections', category: 'guide' },
  { id: 'templates', title: 'Using Templates', category: 'guide' },
  { id: 'canvas-navigation', title: 'Canvas Navigation', category: 'guide' },
  { id: 'sticky-notes-groups', title: 'Sticky Notes & Groups', category: 'guide' },
  { id: 'sharing', title: 'Sharing Diagrams', category: 'guide' },
  { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', category: 'guide' },
  { id: 'text-formatting', title: 'Text Formatting', category: 'guide' },
  { id: 'image-upload', title: 'Image Upload', category: 'guide' },
  { id: 'ai-generation', title: 'AI Diagram Generation', category: 'guide' },
  // Architecture
  { id: 'tech-overview', title: 'Tech Stack Overview', category: 'architecture' },
  { id: 'frontend-arch', title: 'Frontend Architecture', category: 'architecture' },
  { id: 'backend-arch', title: 'Backend Architecture', category: 'architecture' },
  { id: 'database', title: 'Database Design', category: 'architecture' },
  { id: 'auth', title: 'Authentication', category: 'architecture' },
  { id: 'sharing-collab', title: 'Sharing & Collaboration', category: 'architecture' },
  { id: 'canvas-engine', title: 'Canvas Engine', category: 'architecture' },
  { id: 'auto-save', title: 'Auto-save & Persistence', category: 'architecture' },
  { id: 'testing', title: 'Testing & Deployment', category: 'architecture' },
];

// ─── Keyboard Shortcuts Data ───────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ['V'], action: 'Select & Move tool' },
  { keys: ['C'], action: 'Connect tool' },
  { keys: ['N'], action: 'Sticky Note tool' },
  { keys: ['I'], action: 'Upload image' },
  { keys: ['Ctrl', 'Z'], action: 'Undo (50-step history)' },
  { keys: ['Ctrl', 'S'], action: 'Save diagram' },
  { keys: ['Ctrl', 'A'], action: 'Select all items' },
  { keys: ['Ctrl', 'C'], action: 'Copy selected' },
  { keys: ['Ctrl', 'V'], action: 'Paste at viewport center' },
  { keys: ['Delete'], action: 'Delete selected' },
  { keys: ['Escape'], action: 'Deselect all' },
  { keys: ['Scroll'], action: 'Zoom in/out' },
  { keys: ['Click + Drag'], action: 'Pan canvas' },
];

// ─── Tech Cards Data ───────────────────────────────────────────────────────────

interface TechItem {
  name: string;
  version: string;
  description: string;
  color: string;
}

const TECH_STACK: TechItem[] = [
  { name: 'React', version: '19', description: 'UI library with concurrent rendering', color: '#61dafb' },
  { name: 'TypeScript', version: '5.6', description: 'Type-safe JavaScript superset', color: '#3178c6' },
  { name: 'Vite', version: '7', description: 'Lightning-fast dev server & bundler', color: '#bd34fe' },
  { name: 'Express', version: '4', description: 'HTTP server & REST API layer', color: '#68a063' },
  { name: 'MongoDB', version: '6', description: 'Document database with GridFS', color: '#47a248' },
  { name: 'JWT', version: '', description: '7-day auth tokens, role-based middleware', color: '#d63aff' },
  { name: 'GridFS', version: '', description: 'Binary image storage in MongoDB', color: '#47a248' },
  { name: 'Google OAuth', version: '2.0', description: 'Secure third-party authentication', color: '#4285f4' },
  { name: 'Playwright', version: '', description: 'End-to-end browser testing', color: '#2ead33' },
  { name: 'Canvas Engine', version: '', description: 'Custom-built diagram renderer', color: '#f59e0b' },
];

// ─── Code Block Component ──────────────────────────────────────────────────────

function CodeBlock({ filename, language, children }: { filename?: string; language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        {filename && <span className="docs-code-filename">{filename}</span>}
        <span className="docs-code-lang">{language}</span>
        <button className="docs-code-copy" onClick={handleCopy}>
          {copied ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
          )}
        </button>
      </div>
      <pre className="docs-code-content"><code>{children}</code></pre>
    </div>
  );
}

// ─── Screenshot Placeholder ────────────────────────────────────────────────────

function ScreenshotPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="docs-gif-placeholder">
      <div className="docs-gif-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </div>
      <div className="docs-gif-title">{title}</div>
      <div className="docs-gif-desc">{description}</div>
    </div>
  );
}

// ─── Tech Card ─────────────────────────────────────────────────────────────────

function TechCard({ item }: { item: TechItem }) {
  return (
    <div className="docs-tech-card" style={{ borderTopColor: item.color }}>
      <div className="docs-tech-card-name">
        {item.name}
        {item.version && <span className="docs-tech-card-version">v{item.version}</span>}
      </div>
      <div className="docs-tech-card-desc">{item.description}</div>
    </div>
  );
}

// ─── Architecture Detail Box ───────────────────────────────────────────────────

function ArchBox({ title, items, accent }: { title: string; items: string[]; accent?: string }) {
  return (
    <div className="docs-arch-box" style={accent ? { borderLeftColor: accent } : undefined}>
      <div className="docs-arch-box-title">{title}</div>
      <ul className="docs-arch-box-list">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

// ─── Search Modal (Cmd+K) ──────────────────────────────────────────────────────

function SearchModal({ visible, onClose, onNavigate }: { visible: boolean; onClose: () => void; onNavigate: (id: string, cat: 'guide' | 'architecture') => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    const q = query.toLowerCase();
    return SECTIONS.filter(s =>
      s.title.toLowerCase().includes(q) || s.id.includes(q) || s.category.includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (visible) { setQuery(''); setSelectedIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [visible]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(p => Math.min(p + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(p => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) { onNavigate(results[selectedIdx].id, results[selectedIdx].category); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  if (!visible) return null;

  return (
    <div className="docs-search-overlay" onClick={onClose}>
      <div className="docs-search-modal" onClick={e => e.stopPropagation()}>
        <div className="docs-search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className="docs-search-input"
            placeholder="Search documentation..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="docs-search-esc">ESC</kbd>
        </div>
        <div className="docs-search-results">
          {results.length === 0 ? (
            <div className="docs-search-empty">No results for &ldquo;{query}&rdquo;</div>
          ) : results.map((s, i) => (
            <div
              key={s.id}
              className={`docs-search-result${i === selectedIdx ? ' selected' : ''}`}
              onClick={() => { onNavigate(s.id, s.category); onClose(); }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className={`docs-search-badge ${s.category}`}>{s.category === 'guide' ? 'Guide' : 'Arch'}</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function DocsPage() {
  const { state, dispatch } = useDiagram();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'architecture'>('guide');
  const contentRef = useRef<HTMLDivElement>(null);

  // Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [activeTab]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSearchNav = useCallback((id: string, cat: 'guide' | 'architecture') => {
    setActiveTab(cat);
    setTimeout(() => scrollTo(id), 100);
  }, [scrollTo]);

  const toggleTheme = () => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });

  const guideSections = SECTIONS.filter(s => s.category === 'guide');
  const archSections = SECTIONS.filter(s => s.category === 'architecture');

  return (
    <div className="docs-overlay">
      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={handleSearchNav} />

      {/* ── Header ─────────────────────────────────── */}
      <header className="docs-header">
        <div className="docs-header-left">
          <a href="/" className="docs-logo-link">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="13" r="2.5" fill="currentColor"/>
              <line x1="16" y1="15.5" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="16" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="20" y1="18" x2="16" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="docs-logo-text">ArchFlow</span>
            <span className="docs-logo-badge">Docs</span>
          </a>
        </div>
        <div className="docs-header-center">
          <button className="docs-search-trigger" onClick={() => setSearchOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>Search docs...</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
        <div className="docs-header-right">
          <button className="docs-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {state.theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>
          <a href="/" className="docs-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to App
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <div className="docs-hero">
        <h1 className="docs-hero-title">ArchFlow Documentation</h1>
        <p className="docs-hero-sub">Everything you need to build beautiful architecture diagrams</p>
        <div className="docs-hero-cards">
          <div className="docs-hero-card" onClick={() => { setActiveTab('guide'); setTimeout(() => scrollTo('getting-started'), 100); }}>
            <div className="docs-hero-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </div>
            <div className="docs-hero-card-title">User Guide</div>
            <div className="docs-hero-card-desc">Create diagrams, connect nodes, use templates, and share your work</div>
            <span className="docs-hero-card-cta">Get started →</span>
          </div>
          <div className="docs-hero-card" onClick={() => { setActiveTab('architecture'); setTimeout(() => scrollTo('tech-overview'), 100); }}>
            <div className="docs-hero-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div className="docs-hero-card-title">Architecture &amp; Tech</div>
            <div className="docs-hero-card-desc">Explore the technical stack, canvas engine, and engineering decisions</div>
            <span className="docs-hero-card-cta">Explore stack →</span>
          </div>
          <div className="docs-hero-card" onClick={() => { setActiveTab('guide'); setTimeout(() => scrollTo('keyboard-shortcuts'), 100); }}>
            <div className="docs-hero-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
            </div>
            <div className="docs-hero-card-title">Quick Reference</div>
            <div className="docs-hero-card-desc">Keyboard shortcuts, navigation tips, and power-user tricks</div>
            <span className="docs-hero-card-cta">View shortcuts →</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      <div className="docs-tab-bar">
        <button className={`docs-tab${activeTab === 'guide' ? ' active' : ''}`} onClick={() => setActiveTab('guide')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
          User Guide
        </button>
        <button className={`docs-tab${activeTab === 'architecture' ? ' active' : ''}`} onClick={() => setActiveTab('architecture')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Architecture &amp; Tech
        </button>
      </div>

      {/* ── Layout ─────────────────────────────────── */}
      <div className="docs-layout">
        <nav className="docs-toc">
          <div className="docs-toc-title">On this page</div>
          {(activeTab === 'guide' ? guideSections : archSections).map(s => (
            <a
              key={s.id}
              className={`docs-toc-link${activeSection === s.id ? ' active' : ''}`}
              href={`#${s.id}`}
              onClick={e => { e.preventDefault(); scrollTo(s.id); }}
            >{s.title}</a>
          ))}
        </nav>

        <main className="docs-content" ref={contentRef}>

          {/* ═══════════════════ USER GUIDE ═══════════════════ */}
          {activeTab === 'guide' && (
            <>
              {/* Getting Started */}
              <section id="getting-started" className="docs-section">
                <h2 className="docs-section-title">Getting Started</h2>
                <p className="docs-p">
                  ArchFlow is a collaborative architecture diagramming tool built for developers and teams.
                  Create system architecture diagrams, flowcharts, and technical documentation with an intuitive canvas.
                </p>
                <div className="docs-steps">
                  <div className="docs-step"><div className="docs-step-num">1</div><div><strong>Sign in</strong> — Google OAuth or Dev Mode. Diagrams auto-save to the cloud.</div></div>
                  <div className="docs-step"><div className="docs-step-num">2</div><div><strong>Create a diagram</strong> — Click &quot;+ New Diagram&quot; or start from a template.</div></div>
                  <div className="docs-step"><div className="docs-step-num">3</div><div><strong>Add components</strong> — Drag from the sidebar or click to place at center.</div></div>
                  <div className="docs-step"><div className="docs-step-num">4</div><div><strong>Connect &amp; share</strong> — Draw connections, then share via link or email.</div></div>
                </div>
                <ScreenshotPlaceholder title="ArchFlow Dashboard" description="The main canvas with sidebar, topbar, and diagram workspace" />
              </section>

              {/* Adding Nodes */}
              <section id="adding-nodes" className="docs-section">
                <h2 className="docs-section-title">Adding Nodes</h2>
                <p className="docs-p">
                  80+ node types organized into categories: System Blocks, Shapes, Wireframe, Icons, Groups, Notes, and Connectors.
                </p>
                <div className="docs-feature-grid">
                  <div className="docs-feature"><h4>Click to Place</h4><p>Click any sidebar item to place at viewport center. Repeated clicks stack with offset.</p></div>
                  <div className="docs-feature"><h4>Drag &amp; Drop</h4><p>Drag items from sidebar directly onto canvas for precise positioning.</p></div>
                  <div className="docs-feature"><h4>Edit Inline</h4><p>Double-click any node title or description to edit it in place.</p></div>
                  <div className="docs-feature"><h4>Resize Nodes</h4><p>Drag edges or corners to resize. Min size: 170&times;90px.</p></div>
                </div>
                <ScreenshotPlaceholder title="Adding Nodes" description="Drag components from the sidebar onto the canvas to build your architecture" />
                <h3 className="docs-h3">Node Categories</h3>
                <div className="docs-category-list">
                  <div className="docs-cat-item"><span className="docs-cat-badge blue">System Blocks</span> Server, Database, API Gateway, Load Balancer, Cache, Queue, Microservice</div>
                  <div className="docs-cat-item"><span className="docs-cat-badge purple">Shapes</span> Rectangle, Circle, Diamond, Triangle, Hexagon, Star, Cylinder, Flowchart shapes</div>
                  <div className="docs-cat-item"><span className="docs-cat-badge cyan">Wireframe</span> Browser, Phone, Card, Table, Form, Button — for UI mockups</div>
                  <div className="docs-cat-item"><span className="docs-cat-badge orange">Icons</span> 1000+ icons with search — AWS, Azure, GCP, Kubernetes, DevOps</div>
                </div>
              </section>

              {/* Drawing Connections */}
              <section id="drawing-connections" className="docs-section">
                <h2 className="docs-section-title">Drawing Connections</h2>
                <p className="docs-p">Connect nodes by dragging from one port to another. Three routing algorithms and bidirectional arrows.</p>
                <ScreenshotPlaceholder title="Drawing Connections" description="Drag from a port on one node to a port on another to create a connection" />
                <h3 className="docs-h3">Routing Types</h3>
                <div className="docs-feature-grid three-col">
                  <div className="docs-feature"><h4>Bezier Curves</h4><p>Smooth, organic curves that auto-adjust. Drag midpoint to customize.</p></div>
                  <div className="docs-feature"><h4>Orthogonal</h4><p>Right-angle connectors for professional system diagrams.</p></div>
                  <div className="docs-feature"><h4>Straight Lines</h4><p>Direct point-to-point for minimal, clean diagrams.</p></div>
                </div>
                <CodeBlock language="typescript" filename="types/index.ts">
{`interface Connection {
  from: number;       // Source node/note ID
  to: number;         // Target node/note ID
  fromPort: 'top' | 'bottom' | 'left' | 'right';
  toPort: 'top' | 'bottom' | 'left' | 'right';
  color: NodeColor;   // 8 color options
  label: string;      // Editable label
  direction: 'forward' | 'backward' | 'bidirectional' | 'none';
  routing: 'bezier' | 'orthogonal' | 'straight';
  waypoints?: { x: number; y: number }[];
}`}</CodeBlock>
              </section>

              {/* Templates */}
              <section id="templates" className="docs-section">
                <h2 className="docs-section-title">Using Templates</h2>
                <p className="docs-p">Jump-start with 13 pre-built templates covering common architecture patterns.</p>
                <ScreenshotPlaceholder title="Template Gallery" description="Browse and load pre-built architecture templates" />
                <div className="docs-template-grid">
                  {['Microservices', 'CI/CD Pipeline', 'Serverless', 'Event-Driven', 'Data Pipeline', 'Kubernetes', 'E-Commerce', 'Social Media', 'IoT Platform', 'ML Pipeline', 'Healthcare', 'Banking', 'Game Backend'].map(t => (
                    <div key={t} className="docs-template-chip">{t}</div>
                  ))}
                </div>
              </section>

              {/* Canvas Navigation */}
              <section id="canvas-navigation" className="docs-section">
                <h2 className="docs-section-title">Canvas Navigation</h2>
                <p className="docs-p">Navigate with intuitive zoom, pan, and fit-to-screen controls.</p>
                <div className="docs-feature-grid">
                  <div className="docs-feature"><h4>Zoom</h4><p>Scroll wheel to zoom 15%–300%. Topbar controls for precision.</p></div>
                  <div className="docs-feature"><h4>Pan</h4><p>Middle-click drag or Select tool on empty canvas to pan.</p></div>
                  <div className="docs-feature"><h4>Fit to Screen</h4><p>Right-click → &quot;Fit to Screen&quot; to auto-zoom to all content.</p></div>
                  <div className="docs-feature"><h4>Minimap</h4><p>Bottom-right minimap shows viewport relative to full diagram.</p></div>
                </div>
                <ScreenshotPlaceholder title="Canvas Navigation" description="Zoom, pan, and minimap for navigating large diagrams" />
              </section>

              {/* Sticky Notes & Groups */}
              <section id="sticky-notes-groups" className="docs-section">
                <h2 className="docs-section-title">Sticky Notes &amp; Groups</h2>
                <p className="docs-p">Annotate with colored sticky notes and organize components into group containers.</p>
                <div className="docs-feature-grid">
                  <div className="docs-feature"><h4>Sticky Notes</h4><p>4 colors, resizable, editable, and connectable via ports.</p></div>
                  <div className="docs-feature"><h4>Group Containers</h4><p>8 colors. Drag to resize, nodes inside move with the group.</p></div>
                  <div className="docs-feature"><h4>Auto-grouping</h4><p>Select multiple → right-click → &quot;Group Selected&quot;.</p></div>
                  <div className="docs-feature"><h4>Marquee Select</h4><p>Click-drag on empty canvas to select everything in rectangle.</p></div>
                </div>
                <ScreenshotPlaceholder title="Sticky Notes & Groups" description="Annotations and organizational containers for your diagrams" />
              </section>

              {/* Sharing */}
              <section id="sharing" className="docs-section">
                <h2 className="docs-section-title">Sharing Diagrams</h2>
                <p className="docs-p">Share via public links or email invitations with role-based access control.</p>
                <div className="docs-feature-grid">
                  <div className="docs-feature"><h4>Public Link</h4><p>Generate a shareable URL. Anyone with the link can view or edit.</p></div>
                  <div className="docs-feature"><h4>Email Invites</h4><p>Invite collaborators with specific roles: Owner, Editor, Viewer.</p></div>
                  <div className="docs-feature"><h4>Roles</h4><p><strong>Owner:</strong> Full control. <strong>Editor:</strong> Can modify. <strong>Viewer:</strong> Read-only.</p></div>
                  <div className="docs-feature"><h4>Export</h4><p>Export as PNG image or copy the shareable URL.</p></div>
                </div>
                <ScreenshotPlaceholder title="Sharing Modal" description="Share with public links or email invitations" />
              </section>

              {/* Keyboard Shortcuts */}
              <section id="keyboard-shortcuts" className="docs-section">
                <h2 className="docs-section-title">Keyboard Shortcuts</h2>
                <p className="docs-p">Power through your workflow with shortcuts for every common action.</p>
                <div className="docs-shortcuts-wrap">
                  <table className="docs-shortcuts-table">
                    <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
                    <tbody>
                      {SHORTCUTS.map((s, i) => (
                        <tr key={i}>
                          <td><span className="docs-key-group">{s.keys.map((k, j) => (
                            <React.Fragment key={j}>{j > 0 && <span className="docs-key-sep">+</span>}<kbd className="docs-kbd">{k}</kbd></React.Fragment>
                          ))}</span></td>
                          <td>{s.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Text Formatting */}
              <section id="text-formatting" className="docs-section">
                <h2 className="docs-section-title">Text Formatting</h2>
                <p className="docs-p">Customize text on nodes and notes with the floating text toolbar.</p>
                <div className="docs-feature-grid">
                  <div className="docs-feature"><h4>Font Size</h4><p>11px to 24px. Defaults: 13px descriptions, 15px titles.</p></div>
                  <div className="docs-feature"><h4>Styles</h4><p>Bold, italic, underline, and strikethrough.</p></div>
                  <div className="docs-feature"><h4>Alignment</h4><p>Left, center, right. Bullet and numbered lists.</p></div>
                  <div className="docs-feature"><h4>Colors</h4><p>8 accent colors: blue, green, purple, orange, red, cyan, pink, yellow.</p></div>
                </div>
                <ScreenshotPlaceholder title="Text Toolbar" description="Floating toolbar for font, style, alignment, and color options" />
              </section>

              {/* Image Upload */}
              <section id="image-upload" className="docs-section">
                <h2 className="docs-section-title">Image Upload</h2>
                <p className="docs-p">Add images for logos, screenshots, or reference material. Stored in MongoDB GridFS.</p>
                <div className="docs-steps">
                  <div className="docs-step"><div className="docs-step-num">1</div><div>Press <kbd className="docs-kbd">I</kbd> or click Image in topbar</div></div>
                  <div className="docs-step"><div className="docs-step-num">2</div><div>Select an image file (PNG, JPG, GIF, up to 10MB)</div></div>
                  <div className="docs-step"><div className="docs-step-num">3</div><div>Image appears on canvas — drag to move, resize from corners</div></div>
                </div>
              </section>

              {/* AI Generation */}
              <section id="ai-generation" className="docs-section">
                <h2 className="docs-section-title">AI Diagram Generation</h2>
                <p className="docs-p">Describe your architecture in plain English and let AI generate a complete diagram.</p>
                <div className="docs-steps">
                  <div className="docs-step"><div className="docs-step-num">1</div><div>Click the AI star button in the sidebar</div></div>
                  <div className="docs-step"><div className="docs-step-num">2</div><div>Describe your system: &quot;microservices with API gateway, auth service, and PostgreSQL&quot;</div></div>
                  <div className="docs-step"><div className="docs-step-num">3</div><div>AI generates nodes, connections, layout — auto-fits to screen</div></div>
                </div>
                <ScreenshotPlaceholder title="AI Generation" description="Natural language to architecture diagram in seconds" />
              </section>
            </>
          )}

          {/* ═══════════════════ ARCHITECTURE ═══════════════════ */}
          {activeTab === 'architecture' && (
            <>
              {/* Tech Overview */}
              <section id="tech-overview" className="docs-section">
                <h2 className="docs-section-title">Tech Stack Overview</h2>
                <p className="docs-p">
                  ArchFlow is built with a modern, production-grade stack. Zero external dependencies for the canvas engine — everything is custom-built.
                </p>
                <div className="docs-tech-grid">
                  {TECH_STACK.map(t => <TechCard key={t.name} item={t} />)}
                </div>
              </section>

              {/* Frontend Architecture */}
              <section id="frontend-arch" className="docs-section">
                <h2 className="docs-section-title">Frontend Architecture</h2>
                <p className="docs-p">
                  Single-page React 19 app with TypeScript, built with Vite 7. State management uses Context + useReducer — no Redux, no Zustand.
                </p>
                <ArchBox title="Why Context + useReducer over Redux?" accent="#6b9fdb" items={[
                  'Single source of truth: One DiagramState object holds all canvas data',
                  '100+ action types for granular state mutations (ADD_NODE, MOVE_NODE, DELETE_CONNECTION...)',
                  '50-step undo history with automatic snapshots before each mutation',
                  'No external library overhead — React\'s built-in primitives are sufficient',
                  'Direct reducer access enables batch dispatching without middleware',
                ]} />
                <CodeBlock language="typescript" filename="store/DiagramContext.tsx">
{`interface DiagramState {
  nodes: DiagramNode[];       // All canvas nodes
  connections: Connection[];   // Node-to-node connections
  stickyNotes: StickyNote[];  // Annotation notes
  groups: GroupContainer[];    // Visual grouping containers
  selectedNodeIds: number[];   // Multi-selection state
  currentTool: ToolMode;      // 'select' | 'connect' | 'note'
  scale: number;              // Zoom level (0.15 - 3.0)
  panX: number; panY: number; // Canvas pan offset
  theme: Theme;               // 'dark' | 'light'
  // ... counters, auth, undo history
}`}</CodeBlock>
                <ArchBox title="Component Architecture" accent="#9b8acc" items={[
                  'App.tsx — Root component wiring canvas interactions, auth, routing',
                  'Sidebar.tsx — 8-tab rail with SVG icons, drag-and-drop node creation',
                  'Node.tsx — Renders 80+ node types with inline editing, ports, resize handles',
                  'ConnectionsSvg.tsx — SVG layer for connections with 3 routing algorithms',
                  'Custom hooks: useCanvasInteraction, useKeyboard, useAutoSave',
                ]} />
              </section>

              {/* Backend Architecture */}
              <section id="backend-arch" className="docs-section">
                <h2 className="docs-section-title">Backend Architecture</h2>
                <p className="docs-p">
                  Express 4 REST API with JWT auth, serving both API and static SPA. Single-server simplicity with room to scale.
                </p>
                <ArchBox title="15+ REST API Endpoints" accent="#68a063" items={[
                  'GET/POST /api/diagrams — List & create diagrams',
                  'PUT/DELETE /api/diagrams/:id — Update & remove',
                  'POST /api/images — Upload via GridFS',
                  'POST /api/auth/google — OAuth token exchange',
                  'PUT /api/diagrams/:id/sharing — Sharing settings',
                  'GET /api/shared/:token — Access shared diagram',
                  'GET /api/admin/* — Notifications, users, stats',
                  'POST /api/ai/generate — AI diagram generation',
                ]} />
                <CodeBlock language="typescript" filename="server.js">
{`// JWT authentication middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// 7-day token, role-based access
const token = jwt.sign(
  { userId: user._id, email, name, role: 'user' },
  JWT_SECRET, { expiresIn: '7d' }
);`}</CodeBlock>
              </section>

              {/* Database */}
              <section id="database" className="docs-section">
                <h2 className="docs-section-title">Database Design</h2>
                <p className="docs-p">
                  MongoDB 6 with three collections. Full canvas state stored as nested JSON. Images use GridFS for binary storage beyond the 16MB document limit.
                </p>
                <div className="docs-feature-grid three-col">
                  <div className="docs-feature"><h4>diagrams</h4><p>Name, owner, timestamps, sharing config, and the full DiagramData (nodes, connections, notes, groups).</p></div>
                  <div className="docs-feature"><h4>users</h4><p>Google ID, email, name, picture, role, signup time. Indexed on googleId and email.</p></div>
                  <div className="docs-feature"><h4>images (GridFS)</h4><p>Binary storage with 255KB chunks for efficient streaming.</p></div>
                </div>
                <CodeBlock language="json" filename="Diagram Document">
{`{
  "_id": "ObjectId",
  "name": "My Architecture",
  "userId": "ObjectId",
  "data": {
    "nodes": [...],
    "connections": [...],
    "stickyNotes": [...],
    "groups": [...]
  },
  "sharing": {
    "isPublic": false,
    "publicRole": "viewer",
    "shareToken": "abc123",
    "shares": [{ "email": "dev@co.com", "role": "editor" }]
  }
}`}</CodeBlock>
              </section>

              {/* Authentication */}
              <section id="auth" className="docs-section">
                <h2 className="docs-section-title">Authentication</h2>
                <p className="docs-p">
                  Dual auth: Google OAuth 2.0 for production, dev-login bypass for local development. Both issue identical JWTs.
                </p>
                <ArchBox title="Auth Flow" accent="#4285f4" items={[
                  '1. Client renders Google Sign-In button (GSI library)',
                  '2. Google returns credential JWT with user profile',
                  '3. POST /api/auth/google → server verifies, upserts user',
                  '4. Server issues 7-day JWT with userId, email, role',
                  '5. Client stores in localStorage, sends as Bearer token',
                  '6. All API routes verify via authMiddleware',
                  'Dev fallback: POST /api/auth/dev-login when DEV_LOGIN_ENABLED=true',
                ]} />
                <ArchBox title="Security Decisions" accent="#d63aff" items={[
                  'JWT over sessions — stateless, no server-side session store needed',
                  '7-day expiry — balances convenience vs security for a diagramming tool',
                  'Auto-logout on 401 — client clears state and reloads on unauthorized',
                  'Dev login only when explicitly enabled — never in production',
                ]} />
              </section>

              {/* Sharing & Collaboration */}
              <section id="sharing-collab" className="docs-section">
                <h2 className="docs-section-title">Sharing &amp; Collaboration</h2>
                <p className="docs-p">
                  Three-tier sharing: public links, email invites, role-based access. Built without WebSockets — optimistic UI with server sync.
                </p>
                <ArchBox title="Architecture" accent="#5bbf9a" items={[
                  'Share tokens: Random 32-char strings in diagram.sharing.shareToken',
                  'Public toggle: isPublic flag controls link access',
                  'Email invites: Array of { email, role } with Nodemailer delivery',
                  'Role hierarchy: owner > editor > viewer, enforced in API middleware',
                  'Viewer mode: Read-only UI hides sidebar, disables editing',
                ]} />
              </section>

              {/* Canvas Engine */}
              <section id="canvas-engine" className="docs-section">
                <h2 className="docs-section-title">Canvas Engine</h2>
                <p className="docs-p">
                  Custom zero-dependency engine using CSS transforms for zoom/pan and SVG for connections. Pure DOM — no Canvas2D or WebGL.
                </p>
                <ArchBox title="Why DOM over Canvas2D?" accent="#f59e0b" items={[
                  'Inline editing — contentEditable works natively on DOM nodes',
                  'CSS theming — dark/light mode with CSS variables, zero re-rendering',
                  'Native events — DOM events for drag, click, hover, resize',
                  'GPU-accelerated — CSS transforms are hardware-accelerated',
                  'Trade-off: Less efficient at 1000+ nodes, but architecture diagrams rarely reach that',
                ]} />
                <CodeBlock language="typescript" filename="Canvas Transform">
{`// Single CSS transform powers the entire canvas
<div className="canvas" style={{
  transform: \`translate(\${panX}px, \${panY}px) scale(\${scale})\`
}}>
  {/* All nodes, connections, notes render here */}
</div>

// Screen → Canvas coordinate conversion
function screenToCanvas(screenX, screenY, rect, panX, panY, scale) {
  return {
    x: (screenX - rect.left - panX) / scale,
    y: (screenY - rect.top - panY) / scale,
  };
}`}</CodeBlock>
                <div className="docs-feature-grid">
                  <div className="docs-feature"><h4>Connection Routing</h4><p>Bezier (cubic curves), Orthogonal (right-angle paths), Straight (direct). Waypoints for custom routing.</p></div>
                  <div className="docs-feature"><h4>Alignment Guides</h4><p>5px snap threshold with red guide lines when nodes align with others.</p></div>
                  <div className="docs-feature"><h4>Port System</h4><p>4 ports per node (top/bottom/left/right). Appear on hover, snap on drop.</p></div>
                  <div className="docs-feature"><h4>Selection</h4><p>Marquee select, multi-select with Ctrl+Click, copy/paste with connections.</p></div>
                </div>
              </section>

              {/* Auto-save */}
              <section id="auto-save" className="docs-section">
                <h2 className="docs-section-title">Auto-save &amp; Persistence</h2>
                <p className="docs-p">
                  Dual-layer: localStorage for instant recovery, server sync for cloud storage. 2-second debounce prevents excessive saves.
                </p>
                <CodeBlock language="typescript" filename="hooks/useAutoSave.ts">
{`useEffect(() => {
  const serialized = JSON.stringify(data);
  if (serialized === lastSavedRef.current) return;

  timerRef.current = setTimeout(async () => {
    // Layer 1: Always save to localStorage
    localStorage.setItem('archflow-local-diagram', serialized);
    // Layer 2: Sync to server if authenticated
    if (enabled && diagramId && authToken) {
      await API.update(diagramId, { data });
    }
    lastSavedRef.current = serialized;
  }, 2000);  // 2s debounce
}, [data]);`}</CodeBlock>
                <ArchBox title="Persistence Strategy" accent="#d9a06a" items={[
                  'localStorage — immediate backup, survives refresh, works offline',
                  'Server sync — PUT /api/diagrams/:id with full data payload',
                  'JSON.stringify comparison — skips redundant saves',
                  'Load priority: URL param → localStorage → blank canvas',
                ]} />
              </section>

              {/* Testing */}
              <section id="testing" className="docs-section">
                <h2 className="docs-section-title">Testing &amp; Deployment</h2>
                <p className="docs-p">E2E testing with Playwright, single-command deployment on Railway.</p>
                <ArchBox title="Testing" accent="#2ead33" items={[
                  'Playwright E2E — real Chrome, real interactions',
                  'Covers: login, diagram CRUD, templates, sharing',
                  'Dev login enables automation without Google OAuth',
                  'HTML reports with screenshots and traces',
                ]} />
                <CodeBlock language="bash" filename="Development Commands">
{`# Install dependencies
npm install

# Start dev server (Vite + Express)
npm run dev

# Build for production
npx vite build

# Start production server
node server.js

# Run E2E tests
npx playwright test`}</CodeBlock>
                <ArchBox title="Deployment" accent="#6b9fdb" items={[
                  'Single server — Express serves API + Vite static files',
                  'Railway-ready — env vars for MONGODB_URI, JWT_SECRET',
                  'SPA fallback — app.get(\'*\') serves index.html',
                ]} />
              </section>
            </>
          )}
        </main>
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="docs-footer">
        <span>ArchFlow · Built with React, TypeScript &amp; Express</span>
        <a href="/">Back to App</a>
      </footer>
    </div>
  );
}
