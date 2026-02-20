require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const { connect, getDiagrams, getImageBucket, toObjectId, ObjectId } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

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

    res.json({ user });
  } catch (e) {
    console.error('Auth error:', e);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// =============================================
// Diagrams API
// =============================================

// List all diagrams (optionally filtered by userId)
app.get('/api/diagrams', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
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
app.get('/api/diagrams/:id', async (req, res) => {
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
app.post('/api/diagrams', async (req, res) => {
  try {
    const doc = {
      _id: uuidv4(),
      name: req.body.name || 'Untitled Diagram',
      userId: req.body.userId || null,
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
app.put('/api/diagrams/:id', async (req, res) => {
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
app.delete('/api/diagrams/:id', async (req, res) => {
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

// Upload image
app.post('/api/images', upload.single('image'), async (req, res) => {
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

// Get image
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

// Delete image
app.delete('/api/images/:id', async (req, res) => {
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
