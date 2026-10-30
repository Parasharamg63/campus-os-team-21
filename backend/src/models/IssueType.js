const mongoose = require('mongoose');

const issueTypeSchema = new mongoose.Schema({
  issue_type_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 80,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  created_by: {
    type: String,
    default: 'system',
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

module.exports = mongoose.model('IssueType', issueTypeSchema);
