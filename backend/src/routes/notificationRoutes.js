const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { optionalAuth } = require('../middleware/auth');

// GET /api/v1/notifications
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userEmail = req.user ? req.user.email_id : req.query.email || 'all';
    const query = {};

    if (req.user) {
      const isCM = (req.user.role === 'office_staff' && req.user.dept && req.user.dept.toLowerCase().includes('maintenance')) || req.user.role === 'admin';
      if (isCM) {
        query.$or = [
          { recipient_email: req.user.email_id },
          { recipient_email: 'cm@team21.com' },
          { recipient_email: 'all' },
        ];
      } else {
        query.$or = [
          { recipient_email: req.user.email_id },
          { recipient_email: 'all' },
        ];
      }
    } else if (req.query.email) {
      query.$or = [
        { recipient_email: req.query.email },
        { recipient_email: 'all' },
      ];
    }

    const notifications = await Notification.find(query).sort({ created_at: -1 }).limit(50);
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// POST /api/v1/notifications/:id/read
router.post('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    return res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

module.exports = router;
