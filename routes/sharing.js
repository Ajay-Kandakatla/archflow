const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDiagrams, getUsers } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { sendShareInviteEmail } = require('../services/email');

const router = express.Router();

// Get sharing settings for a diagram (owner only)
router.get('/api/diagrams/:id/sharing', requireAuth, async (req, res) => {
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
router.put('/api/diagrams/:id/sharing', requireAuth, async (req, res) => {
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
router.get('/api/shared/:shareToken', optionalAuth, async (req, res) => {
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

module.exports = router;
