const IssueType = require('../models/IssueType');

// GET /api/v1/fixit/issue-types
exports.getIssueTypes = async (req, res) => {
  try {
    const { limit = 100, cursor } = req.query;
    const query = {};
    if (cursor) {
      query._id = { $lt: cursor };
    }
    const maxLimit = Math.min(parseInt(limit, 10) || 100, 100);
    const types = await IssueType.find(query)
      .sort({ created_at: -1 })
      .limit(maxLimit + 1);

    const hasMore = types.length > maxLimit;
    const items = hasMore ? types.slice(0, maxLimit) : types;
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

// GET /api/v1/fixit/issue-types/:id
exports.getIssueTypeById = async (req, res) => {
  try {
    const type = await IssueType.findOne({ issue_type_id: req.params.id });
    if (!type) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue type not found' } });
    }
    return res.status(200).json(type);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// POST /api/v1/fixit/issue-types
exports.createIssueType = async (req, res) => {
  try {
    if (req.user) {
      const isCM = (req.user.role === 'office_staff' && req.user.dept && req.user.dept.toLowerCase().includes('maintenance')) || req.user.role === 'admin';
      if (!isCM) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only Campus Maintenance (CM) staff or Admin can create complaint types.',
          },
        });
      }
    }

    const { name, description } = req.body;
    if (!name || name.trim().length < 3 || name.trim().length > 80) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name must be between 3 and 80 characters.',
          details: [{ field: 'name', message: 'Length must be between 3 and 80 characters' }],
        },
      });
    }

    const trimmedName = name.trim();
    // Unique check (case insensitive)
    const existing = await IssueType.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_EXISTS',
          message: `Issue type with name "${trimmedName}" already exists.`,
        },
      });
    }

    const issue_type_id = `ITY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newType = new IssueType({
      issue_type_id,
      name: trimmedName,
      description: description ? description.trim() : '',
      created_by: req.user ? req.user.email_id : 'cm@team21.com',
    });

    await newType.save();
    return res.status(201).json(newType);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// PATCH /api/v1/fixit/issue-types/:id
exports.updateIssueType = async (req, res) => {
  try {
    if (req.user) {
      const isCM = (req.user.role === 'office_staff' && req.user.dept && req.user.dept.toLowerCase().includes('maintenance')) || req.user.role === 'admin';
      if (!isCM) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only Campus Maintenance (CM) staff or Admin can update complaint types.',
          },
        });
      }
    }

    const type = await IssueType.findOne({ issue_type_id: req.params.id });
    if (!type) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue type not found' } });
    }

    const { name, description } = req.body;
    if (name) {
      const trimmedName = name.trim();
      const existing = await IssueType.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        issue_type_id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          error: { code: 'ALREADY_EXISTS', message: 'An issue type with this name already exists.' },
        });
      }
      type.name = trimmedName;
    }
    if (description !== undefined) {
      type.description = description.trim();
    }

    await type.save();
    return res.status(200).json(type);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// DELETE /api/v1/fixit/issue-types/:id
exports.deleteIssueType = async (req, res) => {
  try {
    if (req.user) {
      const isCM = (req.user.role === 'office_staff' && req.user.dept && req.user.dept.toLowerCase().includes('maintenance')) || req.user.role === 'admin';
      if (!isCM) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only Campus Maintenance (CM) staff or Admin can delete complaint types.',
          },
        });
      }
    }

    const type = await IssueType.findOneAndDelete({ issue_type_id: req.params.id });
    if (!type) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue type not found' } });
    }
    return res.status(200).json({ message: 'Issue type deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
