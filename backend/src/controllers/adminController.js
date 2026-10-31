const User = require('../models/User');
const Ticket = require('../models/Ticket');

// POST /api/v1/admin/users
exports.createUser = async (req, res) => {
  try {
    const { role, name, email_id, phone_number, usn, dept, designation } = req.body;
    const teamDomain = process.env.TEAM_DOMAIN || 'team21.com';
    const teamOtp = process.env.TEAM_OTP || '681305';

    if (!role || !['student', 'faculty', 'office_staff'].includes(role)) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid role is required: student, faculty, or office_staff',
          details: [{ field: 'role', message: 'Must be student, faculty, or office_staff' }],
        },
      });
    }

    if (!email_id || !email_id.toLowerCase().trim().endsWith(`@${teamDomain}`)) {
      return res.status(422).json({
        error: {
          code: 'EMAIL_DOMAIN_MISMATCH',
          message: `User email must end with @${teamDomain}`,
          details: [{ field: 'email_id', message: `Must end with @${teamDomain}` }],
        },
      });
    }

    const emailNormalized = email_id.toLowerCase().trim();

    // Check duplicate email
    const existingEmail = await User.findOne({ email_id: emailNormalized });
    if (existingEmail) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_EXISTS',
          message: 'A user with this email address already exists.',
          details: null,
        },
      });
    }

    // Role specific requirements
    if (role === 'student') {
      if (!usn || !dept) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Students require usn and dept',
            details: [
              ...(!usn ? [{ field: 'usn', message: 'Required for students' }] : []),
              ...(!dept ? [{ field: 'dept', message: 'Required for students' }] : []),
            ],
          },
        });
      }
      if (designation) {
        return res.status(422).json({
          error: {
            code: 'FIELD_NOT_ALLOWED_FOR_ROLE',
            message: 'Designation is not allowed for students',
            details: [{ field: 'designation', message: 'Not valid for role student' }],
          },
        });
      }

      const existingUsn = await User.findOne({ usn: usn.toUpperCase().trim() });
      if (existingUsn) {
        return res.status(409).json({
          error: {
            code: 'ALREADY_EXISTS',
            message: 'A student with this USN already exists.',
            details: null,
          },
        });
      }
    }

    if (role === 'faculty') {
      if (!designation) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Faculty requires designation',
            details: [{ field: 'designation', message: 'Required for faculty' }],
          },
        });
      }
      if (usn || dept) {
        return res.status(422).json({
          error: {
            code: 'FIELD_NOT_ALLOWED_FOR_ROLE',
            message: 'usn or dept not allowed for faculty',
            details: [],
          },
        });
      }
    }

    if (role === 'office_staff') {
      if (!dept || !designation) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Office staff requires both dept and designation',
            details: [],
          },
        });
      }
      if (usn) {
        return res.status(422).json({
          error: {
            code: 'FIELD_NOT_ALLOWED_FOR_ROLE',
            message: 'usn not allowed for office_staff',
            details: [],
          },
        });
      }
    }

    const newUser = new User({
      role,
      name: name.trim(),
      email_id: emailNormalized,
      phone_number: phone_number.trim(),
      usn: usn ? usn.toUpperCase().trim() : undefined,
      dept: dept ? dept.trim() : undefined,
      designation: designation ? designation.trim() : undefined,
      otp: teamOtp,
      team_id: process.env.TEAM_ID || 'team21',
      created_by: req.user.email_id,
    });

    await newUser.save();

    const responseData = newUser.toJSON();
    responseData.otp = teamOtp;

    return res.status(201).json(responseData);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/admin/users
exports.listUsers = async (req, res) => {
  try {
    const { role, limit = 25, cursor } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 25, 100);
    const users = await User.find(query)
      .sort({ _id: -1 })
      .limit(maxLimit + 1);

    const hasMore = users.length > maxLimit;
    const items = hasMore ? users.slice(0, maxLimit) : users;
    const nextCursor = hasMore ? items[items.length - 1]._id : null;

    return res.status(200).json({
      items,
      count: items.length,
      next_cursor: nextCursor,
    });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/admin/users/:email_id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({ email_id: req.params.email_id.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// PATCH /api/v1/admin/users/:email_id
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ email_id: req.params.email_id.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const { name, phone_number, dept, designation, usn } = req.body;

    if (name) user.name = name.trim();
    if (phone_number) user.phone_number = phone_number.trim();

    if (user.role === 'student') {
      if (usn) user.usn = usn.toUpperCase().trim();
      if (dept) user.dept = dept.trim();
      if (designation) {
        return res.status(422).json({
          error: {
            code: 'FIELD_NOT_ALLOWED_FOR_ROLE',
            message: 'Designation is not allowed for students',
          },
        });
      }
    }

    if (user.role === 'office_staff') {
      if (dept) user.dept = dept.trim();
      if (designation) user.designation = designation.trim();
    }

    if (user.role === 'faculty') {
      if (designation) user.designation = designation.trim();
    }

    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// POST /api/v1/admin/users/:email_id/regenerate-otp
exports.regenerateOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email_id: req.params.email_id.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    return res.status(200).json({
      message: 'OTP retrieved for user',
      otp: user.otp,
      email_id: user.email_id,
    });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// DELETE /api/v1/admin/users/:email_id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ email_id: req.params.email_id.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalComplaints = await Ticket.countDocuments();
    const solvedComplaints = await Ticket.countDocuments({ status: { $in: ['resolved', 'acknowledged'] } });
    const inProgressComplaints = await Ticket.countDocuments({ status: 'open' });

    const today = new Date().toISOString().split('T')[0];
    const overdueComplaints = await Ticket.countDocuments({
      status: 'open',
      'tat.expected_by': { $lt: today, $ne: null },
    });

    const cmStaffCount = await User.countDocuments({
      role: 'office_staff',
      dept: /campus maintenance/i,
    });

    const studentCount = await User.countDocuments({ role: 'student' });

    // Category breakdown
    const categoryStats = await Ticket.aggregate([
      { $group: { _id: '$issue_type_name', count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      totalComplaints,
      solvedComplaints,
      inProgressComplaints,
      overdueComplaints,
      cmStaffCount,
      studentCount,
      categoryStats,
    });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
