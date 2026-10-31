const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['admin', 'student', 'faculty', 'office_staff'],
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email_id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone_number: {
    type: String,
    required: true,
    trim: true,
  },
  // Student specific
  usn: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
  },
  // Student and Office staff specific
  dept: {
    type: String,
    trim: true,
  },
  // Faculty and Office staff specific
  designation: {
    type: String,
    trim: true,
  },
  otp: {
    type: String,
    default: '681305',
  },
  team_id: {
    type: String,
    default: 'team21',
  },
  institution_name: {
    type: String,
    default: 'Team 21 Campus',
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

module.exports = mongoose.model('User', userSchema);
