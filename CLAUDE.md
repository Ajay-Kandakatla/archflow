# CLAUDE.md — ArchFlow

## Project Overview

ArchFlow is a full-stack architecture diagram builder web app. Users create, share, and collaborate on architecture diagrams with real-time auto-save. Deployed on **Railway** (backend + static frontend) with **MongoDB Atlas** for storage.

**Live URL:** Deployed on Railway (auto-deploys from `main` branch)
**Repo:** https://github.com/Ajay-Kandakatla/archflow.git

---

## Tech Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Frontend   | React 19 + TypeScript 5.9, Vite 7.3            |
| Backend    | Express 4.21 (Node.js), CommonJS (`server.js`) |
| Database   | MongoDB Atlas (via `mongodb` 6.12 driver)      |
| Auth       | Google Sign-In (ID token) + JWT sessions        |
| File Store | MongoDB GridFS (images bucket)                  |
| Email      | Nodemailer (SMTP, optional)                     |
| Export     | html2canvas + jsPDF                             |
| Testing    | Playwright (E2E)                                |
| Runtime    | Node.js v20.20.0                                |

---

## Project Structure

```
archflow/
├── server.js              # Express backend — all API routes, auth, static serving
├── db.js                  # MongoDB connection, GridFS bucket, collection accessors
├── index.html             # Vite HTML entry point
├── vite.config.ts         # Vite config — proxy /api to localhost:3000
├── tsconfig.json          # TypeScript config — strict, baseUrl ".", alias @/ -> src/
├── playwright.config.ts   # Playwright E2E config
├── package.json           # Scripts, dependencies
├── .env                   # MONGODB_URI, JWT_SECRET (gitignored)
├── src/
│   ├── App.tsx            # Root component — canvas, routing, auth restore, all UI orchestration
│   ├── main.tsx           # React entry point
│   ├── styles.css         # All styles (single CSS file, no CSS modules)
│   ├── components/        # 23 React components (TSX)
│   │   ├── Topbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Node.tsx
│   │   ├── ConnectionsSvg.tsx
│   │   ├── GroupContainer.tsx
│   │   ├── StickyNoteComponent.tsx
│   │   ├── CanvasImage.tsx
│   │   ├── ProjectPanel.tsx
│   │   ├── ShareModal.tsx
│   │   ├── LoginOverlay.tsx
│   │   ├── TemplateModal.tsx
│   │   ├── AiPromptPanel.tsx
│   │   ├── TextToolbar.tsx
│   │   ├── ContextMenu.tsx
│   │   ├── Minimap.tsx
│   │   ├── AlignmentGuides.tsx
│   │   ├── MarqueeSelection.tsx
│   │   ├── HintOverlay.tsx
│   │   ├── AdminOverlay.tsx
│   │   ├── DocsPage.tsx
│   │   ├── Toast.tsx
│   │   ├── IconLibrary.tsx
│   │   └── NodeIcon.tsx
│   ├── hooks/
│   │   ├── useAutoSave.ts       # Debounced auto-save (2s) to server + localStorage
│   │   ├── useCanvasInteraction.ts  # Pan, zoom, drop, marquee, click routing
│   │   └── useKeyboard.ts       # Keyboard shortcut bindings
│   ├── store/
│   │   ├── DiagramContext.tsx    # React Context + useReducer — 50+ action types, undo stack
│   │   └── constants.ts         # Component types (CT), color values (CV), shape/wireframe classifications
│   ├── types/
│   │   └── index.ts             # All TypeScript types — DiagramNode, Connection, StickyNote, GroupContainer, etc.
│   └── utils/
│       ├── api.ts               # API client — wraps fetch with auth headers, 401 auto-logout
│       ├── canvas.ts            # screenToCanvas coordinate transforms
│       ├── snap.ts              # Alignment/snapping logic
│       └── templates.ts         # Pre-built template data
├── e2e/                         # Playwright test specs
│   ├── fixtures.ts
│   ├── canvas.spec.ts
│   ├── nodes.spec.ts
│   ├── groups.spec.ts
│   ├── shapes.spec.ts
│   ├── sidebar.spec.ts
│   ├── toolbar.spec.ts
│   ├── wireframe.spec.ts
│   └── page-load.spec.ts
├── dist/                        # Vite build output (production)
└── public/                      # Static assets (favicon, screenshots)
```

---

## Development Setup

### Prerequisites
- Node.js v20+ (project uses v20.20.0 via nvm)
- MongoDB Atlas connection string (or local MongoDB)

### Environment Variables (`.env`)
```
MONGODB_URI=mongodb+srv://...          # Required — MongoDB Atlas connection
JWT_SECRET=...                         # Required — JWT signing secret
PORT=3000                              # Optional — backend port (default 3000)
GOOGLE_CLIENT_ID=...                   # Optional — enables Google Sign-In (without it, dev login is used)
DEV_LOGIN_ENABLED=true                 # Optional — allow dev login even with Google Client ID set
SMTP_HOST=...                          # Optional — email notifications
SMTP_PORT=587                          # Optional
SMTP_USER=...                          # Optional
SMTP_PASS=...                          # Optional
SMTP_FROM=...                          # Optional
ADMIN_EMAIL=Ajaykandakatla@gmail.com   # Admin user email
```

### Running Locally

**Frontend dev server** (Vite, port 5173, proxies /api to :3000):
```bash
npm run dev
```

**Backend dev server** (Express, port 3000, auto-reload):
```bash
npm run dev:server
```

**Both must run simultaneously for full functionality.** The Vite dev server proxies all `/api/*` requests to the Express backend at `localhost:3000`.

### Build for Production
```bash
npm run build          # Vite builds to dist/
npm start              # Express serves dist/ statically + API routes
```

---

## Railway Deployment

- Railway auto-deploys from the `main` branch on push
- **Build command:** `npm run build` (runs `npx vite build`)
- **Start command:** `npm start` (runs `node server.js`)
- The Express server serves the Vite `dist/` folder as static files and handles all `/api/*` routes
- Railway sets `PORT` automatically — the server binds to `0.0.0.0:$PORT`
- SMTP uses `family: 4` (IPv4) because Railway doesn't support IPv6 outbound
- Environment variables are configured in Railway's dashboard (MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, SMTP_*, etc.)

---

## Architecture & Key Patterns

### State Management
- **Single React Context** (`DiagramContext.tsx`) with `useReducer` — no external state library
- 50+ action types dispatched via `dispatch({ type: 'ACTION_NAME', payload: ... })`
- **Undo system:** Snapshot-based, stores last 50 states, triggered by `dispatch({ type: 'UNDO' })`
- State shape: `DiagramState` with nodes, connections, stickyNotes, canvasImages, groups, selection state, tool mode, zoom/pan, auth, theme

### Canvas System
- HTML-based canvas (not `<canvas>`) with CSS `transform: translate() scale()` for pan/zoom
- Nodes are positioned absolutely inside the canvas div
- Connections rendered as SVG (`ConnectionsSvg.tsx`)
- Coordinate transforms: `screenToCanvas()` in `utils/canvas.ts`

### Node Types
- **Component nodes** (architecture components like Browser, Server, Redis, etc.) — defined in `CT` constant in `constants.ts`
- **Shape nodes** — geometric shapes (circle, diamond, hexagon, etc.) — classified by `SHAPE_TYPES` set
- **Wireframe nodes** — UI mockup elements (button, input, card, etc.) — classified by `WIREFRAME_TYPES` set
- **Icon nodes** — SVG icon-based nodes — classified by `ICON_NODE_TYPE`

### Auth Flow
1. Frontend calls `GET /api/config` to check if Google Client ID is configured
2. If Google Client ID exists → Google Sign-In button shown, credential sent to `POST /api/auth/google`
3. If no Google Client ID or `DEV_LOGIN_ENABLED=true` → dev login form (name + email), sent to `POST /api/auth/dev-login`
4. Server returns JWT token (7-day expiry) + user object, stored in localStorage
5. All authenticated API calls use `Authorization: Bearer <token>` header

### Auto-Save
- `useAutoSave` hook debounces at 2 seconds
- Always saves to localStorage as backup
- If authenticated with a diagram ID, also saves to server via `PUT /api/diagrams/:id`
- Only saves when data actually changes (JSON comparison)

### Sharing System
- Diagrams can be shared via share token URL (`/s/{shareToken}`)
- Roles: `owner`, `editor`, `viewer`
- Public sharing (anyone with link) or email-based sharing
- Share settings stored on the diagram document (`isPublic`, `publicRole`, `shares[]`, `shareToken`)

### URL Routing
- SPA with manual routing (no React Router)
- `/` — main app, `?d={diagramId}` loads specific diagram
- `/s/{shareToken}` — shared diagram view
- `/docs` — documentation page
- Express SPA fallback: all non-`/api` GET routes serve `index.html`

---

## API Routes (server.js)

| Method | Route                          | Auth     | Purpose                          |
| ------ | ------------------------------ | -------- | -------------------------------- |
| GET    | /api/config                    | None     | Google Client ID + dev login flag |
| POST   | /api/auth/google               | None     | Google token exchange → JWT       |
| POST   | /api/auth/dev-login            | None     | Dev login (name + email) → JWT    |
| GET    | /api/diagrams                  | Required | List user's diagrams              |
| GET    | /api/diagrams/shared-with-me   | Required | List diagrams shared with user    |
| GET    | /api/diagrams/:id              | Required | Get diagram with full data        |
| POST   | /api/diagrams                  | Required | Create new diagram                |
| PUT    | /api/diagrams/:id              | Required | Update diagram (auto-save target) |
| DELETE | /api/diagrams/:id              | Required | Delete diagram                    |
| GET    | /api/diagrams/:id/sharing      | Required | Get sharing settings (owner only) |
| PUT    | /api/diagrams/:id/sharing      | Required | Update sharing settings           |
| GET    | /api/shared/:shareToken        | Optional | Access shared diagram             |
| POST   | /api/images                    | Required | Upload image (GridFS)             |
| GET    | /api/images/:id                | None     | Get image (public, for img tags)  |
| DELETE | /api/images/:id                | Required | Delete image                      |
| GET    | /api/admin/users               | Admin    | List all users                    |
| GET    | /api/admin/stats               | Admin    | User + diagram counts             |
| GET    | /api/admin/notifications       | Admin    | Recent signups + login activity   |

---

## Database (MongoDB Atlas)

- **Database name:** `archflow_db`
- **Collections:** `diagrams`, `users`
- **GridFS bucket:** `images` (for uploaded images)
- **Indexes:**
  - `diagrams`: `{ updatedAt: -1 }`, `{ userId: 1, updatedAt: -1 }`
  - `users`: `{ email: 1 }` (unique)
- Diagram `_id` is a UUID string (not ObjectId)
- User `_id` is Google `sub` claim or `dev-{email}` for dev logins

---

## Testing

```bash
npm test                 # Run all Playwright tests (headless)
npm run test:headed      # Run tests with visible browser
npm run test:ui          # Playwright interactive UI
npm run test:report      # View last test report
```

- Tests run against `TEST_URL` env var or default to Vite dev server (localhost:5173)
- Playwright auto-starts Vite dev server if `TEST_URL` is not set
- Tests cover: canvas interactions, node CRUD, connections, groups, shapes, sidebar, toolbar, wireframes, page load

---

## Common Development Tasks

### Adding a new component type
1. Add entry to `CT` in `src/store/constants.ts`
2. Add to the appropriate `SIDEBAR_SECTIONS` array
3. If it's a shape, add to `SHAPE_TYPES` set
4. If it needs custom dimensions, add to `DEFAULT_DIMENSIONS`

### Adding a new API endpoint
1. Add route in `server.js`
2. Add corresponding method in `src/utils/api.ts`
3. Use `requireAuth` middleware for authenticated routes

### Adding a new reducer action
1. Add type to `DiagramAction` union in `DiagramContext.tsx`
2. Add case to the reducer function
3. If it modifies diagram data, push to undo history

---

## Important Notes

- **Single CSS file:** All styles live in `src/styles.css` — no CSS modules or Tailwind
- **No React Router:** URL routing is manual via `window.location.pathname` and `history.replaceState`
- **Backend is CommonJS:** `server.js` and `db.js` use `require()`/`module.exports`, not ESM
- **Frontend is ESM:** All `src/` files use TypeScript with ESM imports, path alias `@/` → `src/`
- **No connection pooling config:** MongoDB driver manages its own connection pool
- **Images are public:** `GET /api/images/:id` has no auth (needed for `<img>` tags)
- **Admin email is hardcoded fallback:** `ADMIN_EMAIL` env var or defaults to `Ajaykandakatla@gmail.com`
