const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  author_name: {
    type: String,
    required: true,
  },
  author_email: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  category: {
    type: String,
    default: 'General Service',
  },
  comment: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1000,
  },
  ticket_id: {
    type: String,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
