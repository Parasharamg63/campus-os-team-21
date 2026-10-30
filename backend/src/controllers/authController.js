const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email_id: user.email_id,
      role: user.role,
      dept: user.dept,
    },
    process.env.JWT_SECRET || 'avaaj_super_secret_jwt_key_2026_team21',
    { expiresIn: 43200 } // 12 hours
  );
};

// POST /api/v1/auth/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { email_id, otp } = req.body;
    if (!email_id || !otp) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email_id and otp are required.',
          details: [
            ...(!email_id ? [{ field: 'email_id', message: 'Missing email_id' }] : []),
            ...(!otp ? [{ field: 'otp', message: 'Missing otp' }] : []),
          ],
        },
      });
    }

    const teamDomain = process.env.TEAM_DOMAIN || 'team21.com';
    const emailNormalized = email_id.toLowerCase().trim();

    if (!emailNormalized.endsWith(`@${teamDomain}`)) {
      return res.status(400).json({
        error: {
          code: 'UNKNOWN_INSTITUTION',
          message: `Email domain must match institution domain @${teamDomain}`,
          details: null,
        },
      });
    }

    const user = await User.findOne({ email_id: emailNormalized });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid admin credentials or not an admin account.',
          details: null,
        },
      });
    }

    if (user.otp !== otp.trim()) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect OTP for admin.',
          details: null,
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 43200,
      profile: {
        role: user.role,
        team_id: user.team_id,
        name: user.name,
        email_id: user.email_id,
        phone_number: user.phone_number,
        institution_name: user.institution_name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

// POST /api/v1/auth/login
exports.userLogin = async (req, res) => {
  try {
    const { email_id, otp } = req.body;
    if (!email_id || !otp) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email_id and otp are required.',
          details: [
            ...(!email_id ? [{ field: 'email_id', message: 'Missing email_id' }] : []),
            ...(!otp ? [{ field: 'otp', message: 'Missing otp' }] : []),
          ],
        },
      });
    }

    const teamDomain = process.env.TEAM_DOMAIN || 'team21.com';
    const emailNormalized = email_id.toLowerCase().trim();

    if (!emailNormalized.endsWith(`@${teamDomain}`)) {
      return res.status(400).json({
        error: {
          code: 'UNKNOWN_INSTITUTION',
          message: `Email domain must match registered institution domain @${teamDomain}`,
          details: null,
        },
      });
    }

    const user = await User.findOne({ email_id: emailNormalized });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'No user registered with this email.',
          details: null,
        },
      });
    }

    // Check if admin attempted to use user login
    if (user.role === 'admin') {
      return res.status(400).json({
        error: {
          code: 'USE_ADMIN_LOGIN',
          message: 'Admin account detected. Please use the Admin Login endpoint / screen.',
          details: null,
        },
      });
    }

    if (user.otp !== otp.trim()) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect OTP.',
          details: null,
        },
      });
    }

    const token = generateToken(user);

    const profile = {
      role: user.role,
      team_id: user.team_id,
      name: user.name,
      email_id: user.email_id,
      phone_number: user.phone_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    if (user.usn) profile.usn = user.usn;
    if (user.dept) profile.dept = user.dept;
    if (user.designation) profile.designation = user.designation;

    return res.status(200).json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 43200,
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

// GET /api/v1/users/me
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    const profile = {
      role: user.role,
      team_id: user.team_id,
      name: user.name,
      email_id: user.email_id,
      phone_number: user.phone_number,
      dept: user.dept,
      usn: user.usn,
      designation: user.designation,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/admin/me
exports.getAdminProfile = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not an admin' } });
    }
    return res.status(200).json({
      role: user.role,
      team_id: user.team_id,
      institution_name: user.institution_name,
      name: user.name,
      email_id: user.email_id,
      phone_number: user.phone_number,
    });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
