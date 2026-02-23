require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const nodemailer = require('nodemailer');
const { connect, getDiagrams, getUsers, getImageBucket, toObjectId, ObjectId } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'archflow-dev-secret-change-in-prod';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Ajaykandakatla@gmail.com').toLowerCase();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// =============================================
// Email notification (for admin alerts)
// =============================================
let emailTransporter = null;

function initEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (smtpHost && smtpUser && smtpPass) {
    emailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      family: 4, // Force IPv4 — Railway doesn't support IPv6 outbound
    });
    console.log('  Email notifications enabled via', smtpHost);
  } else {
    console.log('  Email notifications disabled (set SMTP_HOST, SMTP_USER, SMTP_PASS to enable)');
  }
}

async function sendAdminNewUserEmail(user) {
  if (!emailTransporter) return;
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await emailTransporter.sendMail({
      from: `"ArchFlow" <${smtpFrom}>`,
      to: ADMIN_EMAIL,
      subject: `🆕 New ArchFlow User: ${user.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #6b9fdb, #9b8acc); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 18px;">🎉 New User Sign-Up</h2>
          </div>
          <div style="background: #f8f9fb; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${user.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${user.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Time</td><td style="padding: 8px 0; color: #0f172a;">${new Date().toLocaleString()}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification from ArchFlow.</p>
          </div>
        </div>
      `,
    });
    console.log('Admin notified about new user:', user.email);
  } catch (e) {
    console.error('Failed to send admin email:', e.message);
  }
}

async function sendShareInviteEmail(toEmail, role, shareUrl, ownerName, diagramName) {
  if (!emailTransporter) {
    console.log(`Share invite email skipped (SMTP not configured): ${toEmail}`);
    return;
  }
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await emailTransporter.sendMail({
      from: `"ArchFlow" <${smtpFrom}>`,
      to: toEmail,
      subject: `${ownerName} shared "${diagramName}" with you on ArchFlow`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #6b9fdb, #9b8acc); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 18px;">📐 Diagram Shared With You</h2>
          </div>
          <div style="background: #f8f9fb; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="font-size: 14px; color: #0f172a; margin: 0 0 16px;"><strong>${ownerName}</strong> shared the diagram <strong>"${diagramName}"</strong> with you as <strong>${role}</strong>.</p>
            <a href="${shareUrl}" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #6b9fdb, #9b8acc); color: white; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px;">Open Diagram</a>
            <p style="font-size: 12px; color: #94a3b8; margin: 16px 0 0;">Or copy this link: <a href="${shareUrl}" style="color: #6b9fdb;">${shareUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification from ArchFlow.</p>
          </div>
        </div>
      `,
    });
    console.log('Share invite email sent to:', toEmail);
  } catch (e) {
    console.error('Failed to send share invite email:', e.message);
  }
}

app.use(express.json({ limit: '10mb' }));

// Serve Vite build output in production, fallback to legacy/ for vanilla JS version
const fs = require('fs');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(path.join(__dirname, 'legacy')));
}

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

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch { /* ignore invalid token */ }
  }
  next();
}

// =============================================
// Config endpoint (serves Google Client ID to frontend)
// =============================================
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    devLoginEnabled: !process.env.GOOGLE_CLIENT_ID || process.env.DEV_LOGIN_ENABLED === 'true',
  });
});

// =============================================
// Dev Login (when Google Client ID is not set, or DEV_LOGIN_ENABLED=true)
// =============================================
app.post('/api/auth/dev-login', async (req, res) => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.DEV_LOGIN_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Dev login disabled in production' });
  }

  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  const userId = 'dev-' + email.replace(/[^a-zA-Z0-9]/g, '-');
  const user = { id: userId, email, name, picture: null };

  // Upsert user in DB
  await getUsers().updateOne(
    { _id: userId },
    {
      $set: { email, name, picture: null, lastLoginAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user, token });
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

    // Check if this is a first-time user
    const existingUser = await getUsers().findOne({ _id: payload.sub });
    const isNewUser = !existingUser;

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

    // If new user, send admin notification email (async, don't block response)
    if (isNewUser) {
      sendAdminNewUserEmail(user).catch(() => {});
    }

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

// List diagrams shared with the current user (must be before :id route)
app.get('/api/diagrams/shared-with-me', requireAuth, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase();
    const docs = await getDiagrams()
      .find({ 'shares.email': email })
      .project({ data: 0 })
      .sort({ updatedAt: -1 })
      .toArray();
    const result = docs.map(doc => {
      const share = (doc.shares || []).find(s => s.email.toLowerCase() === email);
      return { ...doc, role: share?.role || 'viewer' };
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list shared diagrams' });
  }
});

// Get one diagram with full data
app.get('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const doc = await getDiagrams().findOne({ _id: id });
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
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const update = { $set: { updatedAt: new Date() } };
    if (req.body.name !== undefined) update.$set.name = req.body.name;
    if (req.body.data !== undefined) update.$set.data = req.body.data;

    const result = await getDiagrams().findOneAndUpdate(
      { _id: id },
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
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const result = await getDiagrams().deleteOne({ _id: id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

// =============================================
// Sharing API
// =============================================

// Get sharing settings for a diagram (owner only)
app.get('/api/diagrams/:id/sharing', requireAuth, async (req, res) => {
  try {
    const doc = await getDiagrams().findOne({ _id: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.userId !== req.user.userId) return res.status(403).json({ error: 'Not the owner' });
    res.json({
      isPublic: doc.isPublic || false,
      publicRole: doc.publicRole || 'viewer',
      shareToken: doc.shareToken || null,
      shares: doc.shares || [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get sharing settings' });
  }
});

// Update sharing settings (owner only)
app.put('/api/diagrams/:id/sharing', requireAuth, async (req, res) => {
  try {
    const doc = await getDiagrams().findOne({ _id: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.userId !== req.user.userId) return res.status(403).json({ error: 'Not the owner' });

    const update = { $set: {} };
    if (req.body.isPublic !== undefined) update.$set.isPublic = req.body.isPublic;
    if (req.body.publicRole !== undefined) update.$set.publicRole = req.body.publicRole;
    if (req.body.shares !== undefined) update.$set.shares = req.body.shares;

    // Generate share token if needed (also generate when adding email shares)
    let shareToken = doc.shareToken;
    const needsToken = req.body.isPublic || (req.body.shares && req.body.shares.length > 0);
    if (!shareToken && needsToken) {
      shareToken = uuidv4().replace(/-/g, '').slice(0, 12);
      update.$set.shareToken = shareToken;
    }

    await getDiagrams().findOneAndUpdate({ _id: req.params.id }, update);

    // Send invite emails to newly added shares (async, don't block response)
    if (req.body.shares && shareToken) {
      const oldEmails = (doc.shares || []).map(s => s.email.toLowerCase());
      const newShares = req.body.shares.filter(s => !oldEmails.includes(s.email.toLowerCase()));
      if (newShares.length > 0) {
        const shareUrl = `${req.protocol}://${req.get('host')}/s/${shareToken}`;
        const diagramName = doc.name || 'Untitled Diagram';
        // Look up owner name from users collection
        const ownerDoc = await getUsers().findOne({ _id: req.user.userId });
        const ownerName = (ownerDoc && ownerDoc.name) || req.user.email || 'Someone';

        for (const share of newShares) {
          sendShareInviteEmail(share.email, share.role, shareUrl, ownerName, diagramName).catch(() => {});
        }
      }
    }

    res.json({ shareToken: shareToken || doc.shareToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update sharing settings' });
  }
});

// Access a shared diagram by share token
app.get('/api/shared/:shareToken', optionalAuth, async (req, res) => {
  try {
    const doc = await getDiagrams().findOne({ shareToken: req.params.shareToken });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // Determine role
    let role = null;

    // Check if user is the owner
    if (req.user && doc.userId === req.user.userId) {
      role = 'owner';
    }

    // Check if public access is enabled
    if (!role && doc.isPublic) {
      role = doc.publicRole || 'viewer';
    }

    // Check if user has a specific share
    if (!role && req.user) {
      const share = (doc.shares || []).find(s => s.email.toLowerCase() === req.user.email.toLowerCase());
      if (share) role = share.role;
    }

    if (!role) return res.status(403).json({ error: 'Access denied' });

    res.json({
      _id: doc._id,
      name: doc.name,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      data: doc.data,
      role,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to access shared diagram' });
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

// Recent new signups & login activity (for admin notifications)
app.get('/api/admin/notifications', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sinceParam = req.query.since;
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days

    // New users who signed up since the given date
    const newUsers = await getUsers()
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .toArray();

    // Recent login activity (users who logged in since the given date, excluding brand new signups counted above)
    const recentLogins = await getUsers()
      .find({
        lastLoginAt: { $gte: since },
        createdAt: { $lt: since },
      })
      .sort({ lastLoginAt: -1 })
      .limit(20)
      .toArray();

    const notifications = [];

    // Add new signup notifications
    newUsers.forEach(u => {
      notifications.push({
        type: 'new_signup',
        user: { name: u.name, email: u.email, picture: u.picture },
        time: u.createdAt,
        message: `${u.name} (${u.email}) signed up for the first time`,
      });
    });

    // Add returning user login notifications
    recentLogins.forEach(u => {
      notifications.push({
        type: 'returning_login',
        user: { name: u.name, email: u.email, picture: u.picture },
        time: u.lastLoginAt,
        message: `${u.name} logged in`,
      });
    });

    // Sort all notifications by time (newest first)
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      newSignupCount: newUsers.length,
      notifications: notifications.slice(0, 50),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// =============================================
// SPA fallback
// =============================================
app.get('*', (req, res) => {
  // Serve from dist/ (Vite build) if it exists, otherwise legacy/
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
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
