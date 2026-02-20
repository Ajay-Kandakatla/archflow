require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const { connect, getDiagrams, getUsers, getImageBucket, toObjectId, ObjectId } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'archflow-dev-secret-change-in-prod';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Ajaykandakatla@gmail.com').toLowerCase();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// Auth Middleware
// =============================================
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.email.toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// =============================================
// Config endpoint (serves Google Client ID to frontend)
// =============================================
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
});

// =============================================
// Google Auth - verify token endpoint
// =============================================
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'No credential provided' });

  try {
    // Decode the JWT (Google ID token) - we verify the payload
    // In production, use google-auth-library for full verification
    const parts = credential.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Basic validation
    if (!payload.email || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || null,
    };

    // Upsert user in DB
    await getUsers().updateOne(
      { _id: payload.sub },
      {
        $set: {
          email: payload.email,
          name: user.name,
          picture: user.picture,
          lastLoginAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Sign a server token
    const token = jwt.sign(
      { userId: payload.sub, email: payload.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (e) {
    console.error('Auth error:', e);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// =============================================
// Diagrams API (all require auth)
// =============================================

// List user's diagrams
app.get('/api/diagrams', requireAuth, async (req, res) => {
  try {
    const filter = { userId: req.user.userId };
    const rows = await getDiagrams()
      .find(filter, { projection: { data: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list diagrams' });
  }
});

// Get one diagram with full data
app.get('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const doc = await getDiagrams().findOne({ _id: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get diagram' });
  }
});

// Create new diagram
app.post('/api/diagrams', requireAuth, async (req, res) => {
  try {
    const doc = {
      _id: uuidv4(),
      name: req.body.name || 'Untitled Diagram',
      userId: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: req.body.data || {},
    };
    await getDiagrams().insertOne(doc);
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create diagram' });
  }
});

// Update diagram (auto-save target)
app.put('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const update = { $set: { updatedAt: new Date() } };
    if (req.body.name !== undefined) update.$set.name = req.body.name;
    if (req.body.data !== undefined) update.$set.data = req.body.data;

    const result = await getDiagrams().findOneAndUpdate(
      { _id: req.params.id },
      update,
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

// Delete diagram
app.delete('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const result = await getDiagrams().deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

// =============================================
// Images API (GridFS)
// =============================================

// Upload image (requires auth)
app.post('/api/images', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filename = `${uuidv4()}-${req.file.originalname || 'image.png'}`;
    const readable = new Readable();
    readable.push(req.file.buffer);
    readable.push(null);

    const uploadStream = getImageBucket().openUploadStream(filename, {
      contentType: req.file.mimetype,
    });

    await new Promise((resolve, reject) => {
      readable.pipe(uploadStream).on('finish', resolve).on('error', reject);
    });

    res.status(201).json({
      imageId: uploadStream.id.toString(),
      filename,
      size: req.file.size,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get image (public - img tags can't send auth headers)
app.get('/api/images/:id', async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid image ID' });

    // Get file metadata for content type
    const files = await getImageBucket().find({ _id: oid }).toArray();
    if (files.length === 0) return res.status(404).json({ error: 'Image not found' });

    res.set('Content-Type', files[0].contentType || 'image/png');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year (immutable)

    const downloadStream = getImageBucket().openDownloadStream(oid);
    downloadStream.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

// Delete image (requires auth)
app.delete('/api/images/:id', requireAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid image ID' });
    await getImageBucket().delete(oid);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// =============================================
// Admin API
// =============================================

// List all users with diagram counts
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allUsers = await getUsers().find({}).sort({ lastLoginAt: -1 }).toArray();

    const diagramCounts = await getDiagrams().aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]).toArray();
    const countMap = {};
    diagramCounts.forEach(d => { countMap[d._id] = d.count; });

    const result = allUsers.map(u => ({
      id: u._id,
      email: u.email,
      name: u.name,
      picture: u.picture,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      diagramCount: countMap[u._id] || 0,
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Summary statistics
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await getUsers().countDocuments();
    const totalDiagrams = await getDiagrams().countDocuments();
    res.json({ totalUsers, totalDiagrams });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// =============================================
// SPA fallback
// =============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// Start
// =============================================
async function start() {
  try {
    await connect();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  ArchFlow running at http://0.0.0.0:${PORT}\n`);
    });
  } catch (e) {
    console.error('Failed to start:', e.message);
    console.error('\nMake sure your MONGODB_URI in .env is correct.');
    console.error('Get a free cluster at https://cloud.mongodb.com\n');
    process.exit(1);
  }
}

start();
