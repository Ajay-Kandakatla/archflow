const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDiagrams } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getDiagramRoleForUser(diagramDoc, user) {
  if (!diagramDoc || !user) return null;
  if (diagramDoc.userId === user.userId) return 'owner';
  const email = (user.email || '').toLowerCase();
  const share = (diagramDoc.shares || []).find(s => (s.email || '').toLowerCase() === email);
  return share?.role || null;
}

// List user's diagrams
router.get('/api/diagrams', requireAuth, async (req, res) => {
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
router.get('/api/diagrams/shared-with-me', requireAuth, async (req, res) => {
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
router.get('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const doc = await getDiagrams().findOne({ _id: id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const role = getDiagramRoleForUser(doc, req.user);
    if (!role) return res.status(403).json({ error: 'Access denied' });
    res.json({ ...doc, role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get diagram' });
  }
});

// Create new diagram
router.post('/api/diagrams', requireAuth, async (req, res) => {
  try {
    const doc = {
      _id: uuidv4(),
      name: req.body.name || 'Untitled Diagram',
      folder: req.body.folder || '',
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
router.put('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const existing = await getDiagrams().findOne({ _id: id }, { projection: { shares: 1, userId: 1 } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const role = getDiagramRoleForUser(existing, req.user);
    if (!role) return res.status(403).json({ error: 'Access denied' });
    if (role === 'viewer') return res.status(403).json({ error: 'Read-only access' });

    const update = { $set: { updatedAt: new Date() } };
    if (req.body.name !== undefined) update.$set.name = req.body.name;
    if (req.body.data !== undefined) update.$set.data = req.body.data;
    if (req.body.folder !== undefined) {
      if (role !== 'owner') return res.status(403).json({ error: 'Only the owner can change folders' });
      update.$set.folder = req.body.folder;
    }

    const updatedDoc = await getDiagrams().findOneAndUpdate(
      { _id: id },
      update,
      { returnDocument: 'after' }
    );
    if (!updatedDoc) return res.status(404).json({ error: 'Not found' });
    res.json({ ...updatedDoc, role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update diagram' });
  }
});

// Delete diagram
router.delete('/api/diagrams/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Invalid diagram ID' });
    }
    const existing = await getDiagrams().findOne({ _id: id }, { projection: { userId: 1 } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.userId !== req.user.userId) return res.status(403).json({ error: 'Only the owner can delete diagrams' });

    const result = await getDiagrams().deleteOne({ _id: id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete diagram' });
  }
});

module.exports = { router, getDiagramRoleForUser };
