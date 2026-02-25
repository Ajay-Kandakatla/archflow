const express = require('express');
const { getUsers, getDiagrams } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List all users with diagram counts
router.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
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
router.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await getUsers().countDocuments();
    const totalDiagrams = await getDiagrams().countDocuments();
    res.json({ totalUsers, totalDiagrams });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Recent new signups & login activity (for admin notifications)
router.get('/api/admin/notifications', requireAuth, requireAdmin, async (req, res) => {
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

module.exports = router;
