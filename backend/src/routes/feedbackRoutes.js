const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { optionalAuth } = require('../middleware/auth');

// GET /api/v1/feedbacks
router.get('/', async (req, res) => {
  try {
    const list = await Feedback.find().sort({ created_at: -1 }).limit(100);
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// POST /api/v1/feedbacks
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { rating, comment, category, ticket_id, author_name, author_email } = req.body;

    if (!rating || !comment) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Rating and comment are required' },
      });
    }

    const name = req.user ? req.user.name : (author_name || 'Anonymous Student');
    const email = req.user ? req.user.email_id : (author_email || 'student@team21.com');

    const feedback = new Feedback({
      author_name: name,
      author_email: email,
      rating: Number(rating),
      comment: comment.trim(),
      category: category || 'Maintenance Service',
      ticket_id,
    });

    await feedback.save();
    return res.status(201).json(feedback);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

module.exports = router;
