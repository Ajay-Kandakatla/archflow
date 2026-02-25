const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const { getImageBucket, toObjectId } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload image (requires auth)
router.post('/api/images', requireAuth, upload.single('image'), async (req, res) => {
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
router.get('/api/images/:id', async (req, res) => {
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
router.delete('/api/images/:id', requireAuth, async (req, res) => {
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

module.exports = router;
