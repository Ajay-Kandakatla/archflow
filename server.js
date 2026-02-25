require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { connect } = require('./db');
const { initEmailTransporter } = require('./services/email');

const authRoutes = require('./routes/auth');
const { router: diagramRoutes } = require('./routes/diagrams');
const sharingRoutes = require('./routes/sharing');
const imageRoutes = require('./routes/images');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// =============================================
// Static file serving (Vite dist/)
// =============================================
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  // Hashed assets (JS/CSS) — cache for 1 year (immutable, Vite adds content hashes)
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));
  // All other static files — no cache for HTML so browsers always get the latest
  app.use(express.static(distPath, {
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
} else {
  app.use(express.static(path.join(__dirname, 'legacy')));
}

// =============================================
// API Routes
// =============================================
app.use('/', authRoutes);
app.use('/', diagramRoutes);
app.use('/', sharingRoutes);
app.use('/', imageRoutes);
app.use('/', adminRoutes);
app.use('/', aiRoutes);

// =============================================
// SPA fallback
// =============================================
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(distIndex);
  } else {
    res.sendFile(path.join(__dirname, 'legacy', 'index.html'));
  }
});

// =============================================
// Start
// =============================================
async function start() {
  try {
    await connect();
    initEmailTransporter();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`  ArchFlow running at http://0.0.0.0:${PORT}\n`);
    });
  } catch (e) {
    console.error('Failed to start:', e.message);
    console.error('\nMake sure your MONGODB_URI in .env is correct.');
    console.error('Get a free cluster at https://cloud.mongodb.com\n');
    process.exit(1);
  }
}

start();
