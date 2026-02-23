import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDiagram } from '@/store/DiagramContext';
import claudeRaw from '../../CLAUDE.md?raw';

// ─── Markdown Block Types ────────────────────────────────────────────────────

type Block =
  | { type: 'heading'; level: 2 | 3; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; language: string; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'hr' };

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Markdown Parser ─────────────────────────────────────────────────────────

function parseMarkdown(raw: string): Block[] {
  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings (## and ###, skip #)
    const headingMatch = line.match(/^(#{2,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length as 2 | 3;
      const text = headingMatch[2].replace(/\*\*/g, '');
      blocks.push({ type: 'heading', level, text, id: slugify(text) });
      i++;
      continue;
    }

    // Skip top-level heading (#)
    if (/^#\s+/.test(line)) {
      i++;
      continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', language: lang, content: codeLines.join('\n') });
      continue;
    }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      const parseRow = (r: string) => r.split('|').map(c => c.trim()).filter(Boolean);
      const headers = parseRow(line);
      i++; // skip header
      if (i < lines.length && /^\|[\s-:|]+\|/.test(lines[i])) {
        i++; // skip separator
      }
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Ordered lists (1. 2. 3.)
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items, ordered: true });
      continue;
    }

    // Unordered lists
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items, ordered: false });
      continue;
    }

    // Paragraphs (skip empty lines)
    if (line.trim()) {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('---') && !(lines[i].includes('|') && lines[i].trim().startsWith('|')) && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i])) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
      continue;
    }

    i++;
  }

  return blocks;
}

// ─── Inline Renderer ─────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  // Process: **bold**, `code`, [link](url)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // Bold
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      // Inline code
      parts.push(<code key={match.index} className="devdocs-inline-code">{match[4]}</code>);
    } else if (match[5]) {
      // Link
      parts.push(<a key={match.index} href={match[7]} className="devdocs-link">{match[6]}</a>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// ─── Code Block Component ────────────────────────────────────────────────────

function CodeBlock({ language, children }: { language: string; children: string }) {
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

// ─── Main Component ──────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'ajaykandakatla@gmail.com';

export function DevDocsPage() {
  const { state, dispatch } = useDiagram();
  const [activeSection, setActiveSection] = useState('');

  // Admin gate — redirect non-admins
  useEffect(() => {
    // Wait for auth restore (localStorage → state)
    const token = localStorage.getItem('archflow-token');
    if (!token && !state.currentUser) {
      window.location.href = '/';
      return;
    }
    if (state.currentUser && state.currentUser.email.toLowerCase() !== ADMIN_EMAIL) {
      window.location.href = '/';
    }
  }, [state.currentUser]);

  // Parse markdown
  const blocks = useMemo(() => parseMarkdown(claudeRaw), []);

  // Extract TOC items from headings
  const tocItems = useMemo(() =>
    blocks.filter((b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading'),
    [blocks]
  );

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 });
    tocItems.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [tocItems]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const toggleTheme = () => dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });

  // Don't render until we confirm admin
  if (!state.currentUser || state.currentUser.email.toLowerCase() !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="docs-overlay">
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
            <span className="docs-logo-badge devdocs-badge">Dev</span>
          </a>
        </div>
        <div className="docs-header-center" />
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
        <h1 className="docs-hero-title">Developer Documentation</h1>
        <p className="docs-hero-sub">Internal reference from CLAUDE.md — admin only</p>
      </div>

      {/* ── Layout ─────────────────────────────────── */}
      <div className="docs-layout">
        <nav className="docs-toc">
          <div className="docs-toc-title">On this page</div>
          {tocItems.map(item => (
            <a
              key={item.id}
              className={`docs-toc-link${activeSection === item.id ? ' active' : ''}`}
              style={item.level === 3 ? { paddingLeft: 24 } : undefined}
              href={`#${item.id}`}
              onClick={e => { e.preventDefault(); scrollTo(item.id); }}
            >{item.text}</a>
          ))}
        </nav>

        <main className="docs-content">
          {blocks.map((block, i) => {
            switch (block.type) {
              case 'heading':
                return block.level === 2 ? (
                  <section key={i} id={block.id} className="docs-section">
                    <h2 className="docs-section-title">{block.text}</h2>
                  </section>
                ) : (
                  <h3 key={i} id={block.id} className="docs-h3">{block.text}</h3>
                );
              case 'paragraph':
                return <p key={i} className="docs-p">{renderInline(block.text)}</p>;
              case 'code':
                return <CodeBlock key={i} language={block.language}>{block.content}</CodeBlock>;
              case 'table':
                return (
                  <div key={i} className="devdocs-table-wrap">
                    <table className="devdocs-table">
                      <thead>
                        <tr>{block.headers.map((h, j) => <th key={j}>{renderInline(h)}</th>)}</tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, ri) => (
                          <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              case 'list':
                return block.ordered ? (
                  <ol key={i} className="devdocs-list devdocs-list-ordered">
                    {block.items.map((item, li) => <li key={li}>{renderInline(item)}</li>)}
                  </ol>
                ) : (
                  <ul key={i} className="devdocs-list">
                    {block.items.map((item, li) => <li key={li}>{renderInline(item)}</li>)}
                  </ul>
                );
              case 'hr':
                return <hr key={i} className="devdocs-hr" />;
              default:
                return null;
            }
          })}
        </main>
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="docs-footer">
        <span>ArchFlow · Developer Documentation</span>
        <a href="/">Back to App</a>
      </footer>
    </div>
  );
}
