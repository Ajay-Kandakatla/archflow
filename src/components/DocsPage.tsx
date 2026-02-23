import React, { useEffect, useRef, useState } from 'react';
import { useDiagram } from '@/store/DiagramContext';

// ── Sub-components ──────────────────────────────────────────

function GifPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="docs-gif-placeholder">
      <div className="docs-gif-placeholder-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polygon points="8,5 20,12 8,19" fill="currentColor" />
        </svg>
      </div>
      <div className="docs-gif-placeholder-label">{title}</div>
      <div className="docs-gif-placeholder-desc">{description}</div>
    </div>
  );
}

function TechCard({ icon, name, version, description, color }: {
  icon: React.ReactNode; name: string; version?: string; description: string; color: string;
}) {
  return (
    <div className="docs-tech-card" style={{ borderTopColor: color, borderTopWidth: 3 }}>
      <div className="docs-tech-card-icon" style={{ color }}>{icon}</div>
      <div className="docs-tech-card-name">
        {name}
        {version && <span className="docs-tech-card-version"> {version}</span>}
      </div>
      <div className="docs-tech-card-desc">{description}</div>
    </div>
  );
}

function ArchBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="docs-arch-box">
      <h4>{title}</h4>
      <ul>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

// ── TOC data ────────────────────────────────────────────────

const TOC_SECTIONS = [
  { id: 'guide', label: 'User Guide', heading: true },
  { id: 'adding-nodes', label: 'Adding Nodes' },
  { id: 'connections', label: 'Drawing Connections' },
  { id: 'templates', label: 'Using Templates' },
  { id: 'navigation', label: 'Canvas Navigation' },
  { id: 'notes-groups', label: 'Notes & Groups' },
  { id: 'sharing', label: 'Sharing Diagrams' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts' },
  { id: 'formatting', label: 'Text Formatting' },
  { id: 'images', label: 'Image Upload' },
  { id: 'architecture', label: 'Architecture', heading: true },
  { id: 'tech-stack', label: 'Tech Stack' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'database', label: 'Database' },
  { id: 'auth', label: 'Authentication' },
  { id: 'collab', label: 'Collaboration' },
  { id: 'canvas-engine', label: 'Canvas Engine' },
  { id: 'autosave', label: 'Auto-save' },
  { id: 'testing', label: 'Testing & Deploy' },
];

// ── Main component ──────────────────────────────────────────

export function DocsPage() {
  const { state, dispatch } = useDiagram();
  const [activeId, setActiveId] = useState('adding-nodes');
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll spy
  useEffect(() => {
    const container = contentRef.current?.closest('.docs-overlay');
    if (!container) return;
    const ids = TOC_SECTIONS.filter(s => !s.heading).map(s => s.id);

    const onScroll = () => {
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveId(ids[i]);
            return;
          }
        }
      }
      setActiveId(ids[0]);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="docs-overlay">
      {/* ── Header ─────────────────────────────── */}
      <div className="docs-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="13" r="2.5" fill="white"/>
              <line x1="16" y1="15.5" x2="16" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="16" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="20" y1="18" x2="16" y2="15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>ArchFlow Docs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="docs-header-btn" onClick={toggleTheme} title="Toggle theme">
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <a href="/" className="docs-header-btn docs-back-btn">
            ← Back to App
          </a>
        </div>
      </div>

      {/* ── Layout ─────────────────────────────── */}
      <div className="docs-layout">
        {/* TOC Sidebar */}
        <nav className="docs-toc">
          {TOC_SECTIONS.map(s =>
            s.heading ? (
              <div key={s.id} className="docs-toc-heading">{s.label}</div>
            ) : (
              <div
                key={s.id}
                className={`docs-toc-item${activeId === s.id ? ' active' : ''}`}
                onClick={() => scrollTo(s.id)}
              >
                {s.label}
              </div>
            )
          )}
        </nav>

        {/* Main Content */}
        <div className="docs-content" ref={contentRef}>

          {/* ═══════════════════════════════════════ */}
          {/* SECTION 1: USER GUIDE                   */}
          {/* ═══════════════════════════════════════ */}
          <div className="docs-hero">
            <h1 className="docs-hero-title">User Guide</h1>
            <p className="docs-hero-sub">Learn how to build beautiful architecture diagrams in minutes</p>
          </div>

          {/* 1. Adding Nodes */}
          <div className="docs-section" id="adding-nodes">
            <h2 className="docs-section-title">Adding Nodes</h2>
            <p>
              The left sidebar contains 80+ architecture components organized by category — client apps,
              servers, databases, message queues, and more. You can add nodes to the canvas in two ways:
            </p>
            <GifPlaceholder
              title="GIF: Adding nodes to the canvas"
              description="Click a component in the sidebar to place it at the viewport center, or drag it directly onto the canvas for precise placement."
            />
            <ArchBox title="How it works" items={[
              'Click the sidebar rail icons to browse categories: System Blocks, Shapes, Wireframe, Icons, Groups, Notes',
              'Click any component to place it at the center of your current view',
              'Or drag a component from the sidebar and drop it exactly where you want',
              'Multiple clicks stack nodes with a slight offset so they don\'t overlap',
              'Double-click a node title to rename it inline',
            ]} />
          </div>

          {/* 2. Drawing Connections */}
          <div className="docs-section" id="connections">
            <h2 className="docs-section-title">Drawing Connections</h2>
            <p>
              Connect nodes to show data flow, dependencies, and relationships. Each node has four
              connection ports (top, bottom, left, right) that appear on hover.
            </p>
            <GifPlaceholder
              title="GIF: Drawing and customizing connections"
              description="Press C to enter connect mode, drag from one port to another to create a connection. Click a label to cycle direction (→ ↔ ←), right-click to change routing (bezier, orthogonal, straight)."
            />
            <ArchBox title="Connection features" items={[
              'Three routing algorithms: Bezier (smooth curves), Orthogonal (right-angle turns), Straight (direct lines)',
              'Cycle direction: forward → backward → bidirectional → none',
              'Double-click a label to rename it',
              'Add waypoints by clicking on a connection line to create custom paths',
              'Connections work between nodes, sticky notes, and across groups',
            ]} />
          </div>

          {/* 3. Using Templates */}
          <div className="docs-section" id="templates">
            <h2 className="docs-section-title">Using Templates</h2>
            <p>
              Start from 13 professionally designed templates instead of building from scratch.
              Templates cover common patterns like microservices, event-driven, serverless, CI/CD, and more.
            </p>
            <GifPlaceholder
              title="GIF: Browsing and loading templates"
              description="Click the Templates button in the toolbar, browse the gallery of pre-built architecture patterns, and click to load one instantly."
            />
            <ArchBox title="Available templates" items={[
              'Persistent Database — multi-tier with caching and replication',
              'Microservices — distributed services with API gateway',
              'Event-Driven — Kafka-based architecture with producers and consumers',
              'Serverless — Lambda functions, API Gateway, managed services',
              'CI/CD Pipeline — Git → Build → Test → Deploy workflow',
              'Data Pipeline — ETL with multi-source ingestion',
              'Full-Stack API — client, server, and data layers',
              'GraphQL Federation — Apollo Supergraph with federated subgraphs',
              'Mind Map, Swimlanes, Kanban Board, and more',
            ]} />
          </div>

          {/* 4. Canvas Navigation */}
          <div className="docs-section" id="navigation">
            <h2 className="docs-section-title">Canvas Navigation</h2>
            <p>
              Navigate an infinite canvas with smooth zoom, pan, and fit-to-screen controls.
              Works with mouse, trackpad, and touch devices.
            </p>
            <GifPlaceholder
              title="GIF: Zoom, pan, and fit-to-screen"
              description="Scroll to pan the canvas, Ctrl+Scroll to zoom in/out (centered on cursor), use the toolbar zoom controls, and press Shift+F to fit all content to screen."
            />
            <ArchBox title="Navigation controls" items={[
              'Scroll wheel: Pan up/down/left/right',
              'Ctrl/Cmd + Scroll: Zoom in/out (15% to 300%)',
              'Middle-click + drag: Pan in any direction',
              'Two-finger pinch: Zoom on trackpad/mobile',
              'Toolbar buttons: +, −, reset (100%), fit to screen',
              'Minimap (bottom-right): Click to jump to any area',
            ]} />
          </div>

          {/* 5. Sticky Notes & Groups */}
          <div className="docs-section" id="notes-groups">
            <h2 className="docs-section-title">Sticky Notes & Groups</h2>
            <p>
              Add colorful sticky notes for annotations and decisions. Organize related components
              into group containers (swimlanes) with automatic child detection.
            </p>
            <GifPlaceholder
              title="GIF: Creating notes and grouping nodes"
              description="Press N to enter note mode, click to place a sticky note, type your annotation. Drag a group container from the sidebar, move nodes inside it, and click 'Group Items' to auto-capture."
            />
            <ArchBox title="Features" items={[
              'Sticky notes: 4 colors (yellow, blue, green, pink) with full text formatting',
              'Notes have connection ports — connect them to nodes to link annotations',
              'Groups: 6 colors with auto-expanding containers',
              'Drag a group to move all contained nodes and notes together',
              'Double-click group title to rename; use "Group Items" button to auto-capture overlapping elements',
            ]} />
          </div>

          {/* 6. Sharing */}
          <div className="docs-section" id="sharing">
            <h2 className="docs-section-title">Sharing Diagrams</h2>
            <p>
              Share diagrams with your team using public links or private email invites.
              Control access with role-based permissions.
            </p>
            <GifPlaceholder
              title="GIF: Sharing a diagram"
              description="Click the Share button, toggle public link access, copy the share URL, or invite collaborators by email with viewer/editor role selection."
            />
            <ArchBox title="Sharing options" items={[
              'Public link: Toggle on to generate a shareable URL — anyone with the link can view or edit',
              'Email invites: Add specific people with viewer or editor roles',
              'Invite emails are sent automatically with a direct link to the diagram',
              'Owner can change roles or revoke access at any time',
              'Read-only viewers see a "read only" banner; editors can modify the diagram',
            ]} />
          </div>

          {/* 7. Keyboard Shortcuts */}
          <div className="docs-section" id="shortcuts">
            <h2 className="docs-section-title">Keyboard Shortcuts</h2>
            <p>Speed up your workflow with these shortcuts:</p>

            <table className="docs-shortcuts-table">
              <thead>
                <tr><th>Shortcut</th><th>Action</th></tr>
              </thead>
              <tbody>
                <tr><td><kbd>V</kbd></td><td>Select & Move tool</td></tr>
                <tr><td><kbd>C</kbd></td><td>Connect tool</td></tr>
                <tr><td><kbd>N</kbd></td><td>Sticky Note tool</td></tr>
                <tr><td><kbd>I</kbd></td><td>Add Image</td></tr>
                <tr><td><kbd>Delete</kbd> / <kbd>Backspace</kbd></td><td>Delete selected items</td></tr>
                <tr><td><kbd>Escape</kbd></td><td>Deselect all / Return to Select tool</td></tr>
                <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo (up to 50 steps)</td></tr>
                <tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>Save diagram</td></tr>
                <tr><td><kbd>Ctrl</kbd>+<kbd>E</kbd></td><td>Export / Share</td></tr>
                <tr><td><kbd>Ctrl</kbd>+<kbd>A</kbd></td><td>Select all elements</td></tr>
                <tr><td><kbd>Ctrl</kbd>+<kbd>C</kbd></td><td>Copy selected items</td></tr>
                <tr><td><kbd>Ctrl</kbd>+<kbd>V</kbd></td><td>Paste</td></tr>
                <tr><td><kbd>Shift</kbd>+<kbd>F</kbd></td><td>Fit to screen</td></tr>
              </tbody>
            </table>
          </div>

          {/* 8. Text Formatting */}
          <div className="docs-section" id="formatting">
            <h2 className="docs-section-title">Text Formatting</h2>
            <p>
              Format text in nodes and sticky notes with the floating text toolbar.
              Select any text element to reveal formatting options.
            </p>
            <GifPlaceholder
              title="GIF: Formatting text in nodes"
              description="Select a node or sticky note, use the floating toolbar to change font size, apply bold/italic/underline, change text color, and adjust alignment (left, center, right)."
            />
            <ArchBox title="Formatting options" items={[
              'Font size: adjust pixel size for titles and descriptions',
              'Bold, italic, underline, and strikethrough styles',
              'Text alignment: left, center, or right',
              'Text color: override the default node color',
              'List style: bullet points, numbered lists, or plain text',
              'Line height: adjust spacing between lines',
            ]} />
          </div>

          {/* 9. Image Upload */}
          <div className="docs-section" id="images">
            <h2 className="docs-section-title">Image Upload</h2>
            <p>
              Add screenshots, logos, or reference images directly to your canvas.
              Images are stored securely and persist with your diagram.
            </p>
            <GifPlaceholder
              title="GIF: Uploading an image"
              description="Press I or click the Image button in the toolbar, select a file (PNG, JPG, up to 10MB), and the image appears on the canvas with drag and resize handles."
            />
            <ArchBox title="Image features" items={[
              'Supports PNG, JPG, and other common formats (up to 10MB)',
              'Drag to reposition, resize from the corner handle',
              'Images are stored in MongoDB GridFS with 1-year browser caching',
              'Hover to see the delete button',
            ]} />
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* SECTION 2: ARCHITECTURE & TECHNOLOGIES  */}
          {/* ═══════════════════════════════════════ */}
          <div className="docs-divider" />

          <div className="docs-hero">
            <h1 className="docs-hero-title">Architecture & Technologies</h1>
            <p className="docs-hero-sub">A deep dive into the technical stack powering ArchFlow</p>
          </div>

          {/* Tech Stack Overview */}
          <div className="docs-section" id="tech-stack">
            <h2 className="docs-section-title">Tech Stack Overview</h2>
            <p>
              ArchFlow is a full-stack application built with modern web technologies,
              designed for performance, reliability, and developer experience.
            </p>
            <div className="docs-tech-grid">
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12s4.7 10.5 10.5 10.5S22.5 17.8 22.5 12 17.8 1.5 12 1.5z" stroke="currentColor" strokeWidth="1.5" fill="none"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>}
                name="React" version="19" description="Latest React with concurrent features, hooks, and functional components" color="var(--accent-cyan)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm2.5 15.5h3.25V10h-3.25v8.5zM11.5 18.5h3.25V7h-3.25v11.5z"/></svg>}
                name="TypeScript" version="5.9" description="Strict mode with full type coverage across frontend and configurations" color="var(--accent-blue)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 22,8 22,16 12,22 2,16 2,8"/></svg>}
                name="Vite" version="7" description="Lightning-fast dev server with HMR, proxied API, and optimized production builds" color="var(--accent-purple)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="1.5"/></svg>}
                name="Express" version="4" description="Lightweight Node.js server with 15+ REST API endpoints and middleware" color="var(--accent-green)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6 2 11c0 3.5 2 6.5 5 8v3l3-2c.6.1 1.3.2 2 .2 5.52 0 10-4 10-9s-4.48-9-10-9z"/></svg>}
                name="MongoDB" version="6" description="Document database with 3 collections, GridFS for images, and optimized indexes" color="var(--accent-green)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5"/></svg>}
                name="JWT" description="JSON Web Tokens with 7-day expiry for stateless authentication" color="var(--accent-orange)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5"/></svg>}
                name="Google OAuth" version="2.0" description="Secure Google Sign-In with ID token verification and user provisioning" color="var(--accent-red)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5"/></svg>}
                name="Nodemailer" version="8" description="SMTP email notifications for new user alerts and share invites" color="var(--accent-pink)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9h6v6H9V9z" stroke="currentColor" strokeWidth="1.5"/></svg>}
                name="Playwright" version="1.58" description="End-to-end browser testing with HTML reports and CI-ready config" color="var(--accent-yellow)" />
              <TechCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                name="Railway" description="Production deployment with IPv4 networking and environment-based config" color="var(--accent-purple)" />
            </div>
          </div>

          {/* Frontend Architecture */}
          <div className="docs-section" id="frontend">
            <h2 className="docs-section-title">Frontend Architecture</h2>
            <p>
              The frontend is a single-page React 19 application built with TypeScript and Vite.
              It uses a custom canvas engine for infinite-scroll diagram editing with real-time interaction.
            </p>
            <ArchBox title="React 19 + TypeScript" items={[
              '23 functional React components with hooks-based architecture',
              'Full TypeScript strict mode with comprehensive type interfaces for all data models',
              'Path aliases (@/) for clean imports via Vite config',
              'Vite 7 with dev server proxy to Express backend on port 3000',
            ]} />
            <ArchBox title="State Management — Context + Reducer" items={[
              'Redux-style reducer pattern using React Context API — no external state libraries',
              '100+ reducer actions for granular state updates (ADD_NODE, MOVE_NODE, RESIZE_NODE, etc.)',
              'Immutable state updates with full TypeScript typing on dispatch payloads',
              '50-step undo history with automatic snapshot management',
              'UI-only actions (SELECT, MOVE during drag) excluded from undo stack to keep it meaningful',
            ]} />
            <ArchBox title="Custom Hooks" items={[
              'useAutoSave — 2-second debounced save to localStorage + server sync',
              'useCanvasInteraction — wheel zoom, middle-click pan, touch pinch, drag-drop, marquee selection',
              'useKeyboard — 15+ keyboard shortcuts (V, C, N, I, Ctrl+Z, Ctrl+S, etc.)',
            ]} />
          </div>

          {/* Backend Architecture */}
          <div className="docs-section" id="backend">
            <h2 className="docs-section-title">Backend Architecture</h2>
            <p>
              The Express.js backend serves as both an API server and static file host.
              It handles authentication, data persistence, image storage, and email notifications.
            </p>
            <ArchBox title="Express 4 Server" items={[
              '15+ REST API endpoints organized by domain (auth, diagrams, sharing, images, admin)',
              'Three-tier middleware: requireAuth (JWT validation), requireAdmin (email check), optionalAuth (for shared views)',
              'SPA fallback route: all non-API requests serve the Vite build output (dist/index.html)',
              '10MB JSON body limit for large diagram data payloads',
              'Static file serving: Vite dist/ → legacy/ fallback',
            ]} />
            <ArchBox title="Image Storage — GridFS" items={[
              'MongoDB GridFS for storing uploaded images as binary chunks',
              'Multer middleware handles multipart file uploads (10MB limit)',
              'Images served with 1-year Cache-Control headers for optimal browser caching',
              'Public image endpoint (no auth required) — allows img tags to load without Bearer tokens',
            ]} />
            <ArchBox title="Email Notifications — Nodemailer" items={[
              'SMTP-based email transport with configurable host, port, user, pass',
              'Two email templates: new user signup alerts (to admin) and share invite emails (to recipients)',
              'Styled HTML emails with gradient headers and responsive tables',
              'IPv4 forced for Railway deployment compatibility',
              'Gracefully disabled when SMTP credentials not configured',
            ]} />
          </div>

          {/* Database Design */}
          <div className="docs-section" id="database">
            <h2 className="docs-section-title">Database Design</h2>
            <p>
              MongoDB 6 with three collections and GridFS for binary image storage.
              Indexes are optimized for the most common query patterns.
            </p>
            <ArchBox title="Collections" items={[
              'diagrams — stores diagram metadata, canvas data (nodes, connections, groups), and sharing config',
              'users — Google OAuth user profiles with creation time and last login tracking',
              'images.files + images.chunks — GridFS bucket for uploaded canvas images',
            ]} />
            <ArchBox title="Indexes" items={[
              'diagrams: { updatedAt: -1 } — sort by recency for project panel',
              'diagrams: { userId: 1, updatedAt: -1 } — compound index for user\'s diagrams',
              'users: { email: 1 } unique — prevents duplicate user records',
            ]} />
            <ArchBox title="Data Model" items={[
              'Diagram data is a single JSON document containing all nodes, connections, notes, images, groups, and counters',
              'Sharing is embedded in the diagram document: isPublic flag, shareToken, and shares array with email + role',
              'User IDs map to Google\'s sub claim (or dev-prefixed IDs in development)',
            ]} />
          </div>

          {/* Authentication */}
          <div className="docs-section" id="auth">
            <h2 className="docs-section-title">Authentication</h2>
            <p>
              Dual authentication system: Google OAuth 2.0 for production and a dev login fallback
              for local development without Google credentials.
            </p>
            <ArchBox title="Google OAuth 2.0 Flow" items={[
              'Frontend renders Google Sign-In button using the GSI library',
              'Google returns an ID token (JWT) with user profile data',
              'Server decodes the token, validates email and sub claims',
              'User is upserted in MongoDB (created on first login)',
              'Server issues a 7-day JWT for subsequent API authentication',
              'Admin notification email sent asynchronously on new user signup',
            ]} />
            <ArchBox title="Dev Login Fallback" items={[
              'Activated automatically when GOOGLE_CLIENT_ID is not set',
              'Simple name + email form on the login screen',
              'Creates dev-prefixed user IDs to avoid collisions with Google users',
              'Disabled automatically in production when Google Client ID is configured',
            ]} />
            <ArchBox title="Authorization Middleware" items={[
              'requireAuth: validates Bearer token, extracts userId and email into req.user',
              'requireAdmin: checks if authenticated user email matches ADMIN_EMAIL env var',
              'optionalAuth: attempts token extraction without failing — used for shared diagram access',
            ]} />
          </div>

          {/* Collaboration */}
          <div className="docs-section" id="collab">
            <h2 className="docs-section-title">Sharing & Collaboration</h2>
            <p>
              Flexible sharing system with public links, private email invites,
              and three-tier role-based access control.
            </p>
            <ArchBox title="Sharing Mechanism" items={[
              'Share tokens: unique 12-character alphanumeric strings generated per diagram',
              'Public links: toggle isPublic flag to allow anyone with the link to view/edit',
              'Email invites: add recipients with specific roles, send styled invite emails via Nodemailer',
              'Share URLs use the pattern /s/{shareToken} — handled by SPA fallback',
            ]} />
            <ArchBox title="Role-Based Access Control" items={[
              'Owner: full read/write access, can manage sharing settings',
              'Editor: can modify the diagram data and connections',
              'Viewer: read-only access with a visible "read only" banner',
              'Access check waterfall: owner → public access → email shares → deny (403)',
            ]} />
          </div>

          {/* Canvas Engine */}
          <div className="docs-section" id="canvas-engine">
            <h2 className="docs-section-title">Canvas Engine</h2>
            <p>
              Custom-built infinite canvas with hardware-accelerated transforms,
              supporting 80+ node types and sophisticated connection routing.
            </p>
            <ArchBox title="Canvas Rendering" items={[
              'CSS transform-based zoom and pan (translate + scale) for smooth 60fps interaction',
              'Zoom range: 15% to 300% with cursor-centered scaling',
              'Grid background with responsive dot pattern',
              'Layered rendering: groups → connections SVG → images → notes → nodes',
              'z-index management for proper element stacking',
            ]} />
            <ArchBox title="80+ Node Types" items={[
              'Organized into layers: Client, Network, Compute, Database, Cache/Queue, Monitoring',
              'Geometric shapes: Rectangle, Circle, Diamond, Hexagon, Cylinder, Parallelogram',
              'Wireframe components: 26 UI elements (Button, Input, Card, Table, etc.)',
              'Custom icon nodes with SVG library support',
              'GraphQL-specific: Supergraph, Subgraph, Gateway',
            ]} />
            <ArchBox title="Connection Routing Algorithms" items={[
              'Bezier: smooth cubic curves with calculated control point offsets',
              'Orthogonal: Manhattan-style routing with automatic right-angle turns',
              'Straight: direct diagonal lines for simple relationships',
              'Waypoint editor: click on any connection to add intermediate control points',
              'Directional arrows with forward, backward, bidirectional, and none modes',
            ]} />
            <ArchBox title="Selection & Interaction" items={[
              'Marquee selection: click and drag on empty canvas to select multiple items',
              'Multi-select: Ctrl/Cmd + Click to toggle individual selection',
              'Alignment guides: 8px snap threshold with visual guide lines during drag',
              'Copy/paste: duplicates selected nodes, notes, groups, and their internal connections',
              'Node resize: 8 handles (4 edges + 4 corners) with minimum size constraints',
            ]} />
          </div>

          {/* Auto-save */}
          <div className="docs-section" id="autosave">
            <h2 className="docs-section-title">Auto-save & Persistence</h2>
            <p>
              Dual-layer persistence ensures your work is never lost — even if the browser crashes
              or you lose network connectivity.
            </p>
            <ArchBox title="Auto-save System" items={[
              '2-second debounce: changes are batched and saved after you stop editing',
              'localStorage backup: immediate local save as a safety net (works offline)',
              'Server sync: authenticated users get automatic cloud saves via PUT /api/diagrams/:id',
              'Serialized state comparison: skips redundant saves when data hasn\'t changed',
              'Diagram ID persisted in localStorage for reload recovery',
            ]} />
          </div>

          {/* Testing & Deployment */}
          <div className="docs-section" id="testing">
            <h2 className="docs-section-title">Testing & Deployment</h2>
            <p>
              End-to-end test coverage with Playwright and streamlined deployment to Railway.
            </p>
            <ArchBox title="Playwright E2E Testing" items={[
              'Test suites cover canvas interactions, node operations, groups, shapes, and wireframes',
              'Chromium-only for fast execution (30-second timeout per test)',
              'HTML report generation with automatic screenshots on failure',
              'Trace capture on first retry for debugging flaky tests',
              'Can run against local dev server or deployed Railway instance via TEST_URL env var',
            ]} />
            <ArchBox title="Railway Deployment" items={[
              'Single command deployment: Vite build output served by Express',
              'Environment-based config: MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, SMTP credentials',
              'IPv4-forced networking for Nodemailer SMTP compatibility',
              'Static file serving with SPA fallback for client-side routing',
              'Zero-downtime deployments with Railway\'s rolling update strategy',
            ]} />
          </div>

          {/* Footer */}
          <div className="docs-footer">
            <p>Built with care by <strong>Ajay Kandakatla</strong></p>
            <p style={{ opacity: 0.5, fontSize: 12 }}>ArchFlow — Architecture Diagram Builder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
