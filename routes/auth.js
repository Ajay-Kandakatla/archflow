const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getUsers } = require('../db');
const { sendAdminNewUserEmail } = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'archflow-dev-secret-change-in-prod';

// =============================================
// Config endpoint (serves Google Client ID to frontend)
// =============================================
router.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    devLoginEnabled: !process.env.GOOGLE_CLIENT_ID || process.env.DEV_LOGIN_ENABLED === 'true',
  });
});

// =============================================
// Dev Login (when Google Client ID is not set, or DEV_LOGIN_ENABLED=true)
// =============================================
router.post('/api/auth/dev-login', async (req, res) => {
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
router.post('/api/auth/google', async (req, res) => {
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

module.exports = router;
