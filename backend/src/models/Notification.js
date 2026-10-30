const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient_email: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  ticket_id: {
    type: String,
  },
  type: {
    type: String,
    enum: ['ticket_created', 'status_updated', 'assigned', 'tat_updated', 'acknowledged', 'general'],
    default: 'general',
  },
  read: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model('Notification', notificationSchema);
