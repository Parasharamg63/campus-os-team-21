const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticket_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  issue_type_id: {
    type: String,
    required: true,
    ref: 'IssueType',
  },
  issue_type_name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 120,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 2000,
  },
  location: {
    type: String,
    trim: true,
    default: 'Campus Premises',
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'resolved', 'acknowledged'],
    default: 'open',
  },
  photo: {
    file_id: String,
    filename: String,
    content_type: String,
    size_bytes: Number,
    url: String,
  },
  resolution_photo: {
    file_id: String,
    filename: String,
    content_type: String,
    size_bytes: Number,
    url: String,
  },
  tat: {
    expected_by: String, // YYYY-MM-DD
    note: String,
    updated_by: String,
    updated_at: Date,
  },
  update: {
    note: String,
    updated_by: String,
    updated_by_name: String,
    updated_at: Date,
  },
  assigned_to: {
    email_id: String,
    name: String,
    designation: String,
    phone_number: String,
    assigned_at: Date,
    assigned_by: String,
  },
  reported_by: {
    type: String,
    required: true,
    trim: true,
  },
  reported_by_name: {
    type: String,
    required: true,
  },
  reported_by_role: {
    type: String,
    default: 'student',
  },
  reported_by_dept: {
    type: String,
    default: '',
  },
  reported_by_phone_number: {
    type: String,
    default: '',
  },
  acknowledged_at: {
    type: Date,
    default: null,
  },
  timeline: [
    {
      status: String,
      note: String,
      actor_name: String,
      actor_role: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      image_url: String,
    }
  ],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for overdue
ticketSchema.virtual('overdue').get(function () {
  if (this.status !== 'open' || !this.tat || !this.tat.expected_by) {
    return false;
  }
  const today = new Date().toISOString().split('T')[0];
  return this.tat.expected_by < today;
});

// Virtuals for photo URLs
ticketSchema.virtual('photo_url').get(function () {
  return this.photo && this.photo.url ? this.photo.url : undefined;
});

ticketSchema.virtual('proof_of_resolution_url').get(function () {
  return this.resolution_photo && this.resolution_photo.url ? this.resolution_photo.url : undefined;
});

module.exports = mongoose.model('Ticket', ticketSchema);
