const path = require('path');
const fs = require('fs');
const Ticket = require('../models/Ticket');
const IssueType = require('../models/IssueType');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to generate IDs
const generateTicketId = () => {
  const timestamp = Date.now().toString(10).slice(-8);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-82067${timestamp}-${randomPart}`;
};

// POST /api/v1/fixit/tickets
exports.createTicket = async (req, res) => {
  try {
    const { issue_type_id, title, description, location, reporter_name, reporter_mobile, reporter_dept } = req.body;

    if (!issue_type_id) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'issue_type_id is required', details: [{ field: 'issue_type_id' }] },
      });
    }

    if (!title || title.trim().length < 3 || title.trim().length > 120) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Title must be between 3 and 120 characters', details: [{ field: 'title' }] },
      });
    }

    if (!description || description.trim().length < 5 || description.trim().length > 2000) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Description must be between 5 and 2000 characters', details: [{ field: 'description' }] },
      });
    }

    // Verify issue type exists
    const issueType = await IssueType.findOne({ issue_type_id });
    if (!issueType) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid issue_type_id', details: [{ field: 'issue_type_id' }] },
      });
    }

    // Determine reporter info
    let reported_by = req.user ? req.user.email_id : 'guest.student@team21.com';
    let reported_by_name = req.user ? req.user.name : (reporter_name || 'Campus Student');
    let reported_by_role = req.user ? req.user.role : 'student';
    let reported_by_dept = req.user ? (req.user.dept || '') : (reporter_dept || 'CSE');
    let reported_by_phone_number = req.user ? req.user.phone_number : (reporter_mobile || '9876543210');

    // Handle photo if uploaded
    let photoData = undefined;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://${req.headers.host || 'localhost:5000'}`;
      photoData = {
        file_id: `PHO-${Date.now().toString(36).toUpperCase()}`,
        filename: req.file.originalname,
        content_type: req.file.mimetype,
        size_bytes: req.file.size,
        url: `${baseUrl}/uploads/${req.file.filename}`,
      };
    }

    const ticket_id = generateTicketId();

    const newTicket = new Ticket({
      ticket_id,
      issue_type_id,
      issue_type_name: issueType.name,
      title: title.trim(),
      description: description.trim(),
      location: location ? location.trim() : 'Campus Premises',
      status: 'open',
      photo: photoData,
      reported_by,
      reported_by_name,
      reported_by_role,
      reported_by_dept,
      reported_by_phone_number,
      timeline: [
        {
          status: 'Registered',
          note: 'Complaint registered by student',
          actor_name: reported_by_name,
          actor_role: reported_by_role,
          timestamp: new Date(),
          image_url: photoData ? photoData.url : undefined,
        }
      ],
    });

    await newTicket.save();

    // Create notification for Campus Maintenance and Admin
    await Notification.create({
      recipient_email: 'cm@team21.com',
      title: 'New Maintenance Ticket Raised',
      message: `[${ticket_id}] ${title.trim()} (${issueType.name}) in ${newTicket.location}`,
      ticket_id,
      type: 'ticket_created',
    });

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error in createTicket:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/fixit/tickets
exports.listTickets = async (req, res) => {
  try {
    const { status, issue_type_id, mine, limit = 25, cursor, search } = req.query;
    const query = {};

    if (status === 'overdue') {
      query.overdue = true;
    } else if (status && status !== 'all') {
      query.status = status;
    }

    if (issue_type_id && issue_type_id !== 'all') {
      query.issue_type_id = issue_type_id;
    }

    if (search) {
      query.$or = [
        { ticket_id: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { reported_by_name: { $regex: search, $options: 'i' } },
        { reported_by_dept: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based visibility
    if (req.user) {
      const isCM = req.user.role === 'office_staff' || req.user.role === 'admin' || (req.user.dept && req.user.dept.toLowerCase().includes('maintenance'));

      if (!isCM) {
        // Students & faculty see only their own tickets
        query.reported_by = req.user.email_id;
      } else if (mine === 'true') {
        // CM or admin explicitly asked for tickets they raised or assigned to them
        query.$or = [
          { reported_by: req.user.email_id },
          { 'assigned_to.email_id': req.user.email_id },
        ];
      }
    }

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 100, 200);
    const tickets = await Ticket.find(query)
      .sort({ created_at: -1 })
      .limit(maxLimit + 1);

    const hasMore = tickets.length > maxLimit;
    const items = hasMore ? tickets.slice(0, maxLimit) : tickets;
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

// GET /api/v1/fixit/tickets/:ticket_id
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    // Role check if user logged in
    if (req.user) {
      const isCM = (req.user.role === 'office_staff' && req.user.dept && req.user.dept.toLowerCase().includes('maintenance')) || req.user.role === 'admin';
      if (!isCM && ticket.reported_by !== req.user.email_id) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found or not authorized to view' } });
      }
    }

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// Public Track endpoint for easy search by Track ID (Wireframe Page 3)
exports.trackTicketById = async (req, res) => {
  try {
    const ticketId = req.params.ticket_id.trim();
    const ticket = await Ticket.findOne({
      $or: [
        { ticket_id: ticketId },
        { ticket_id: { $regex: ticketId, $options: 'i' } },
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `No complaint found with Track ID "${ticketId}"` } });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// PATCH /api/v1/fixit/tickets/:ticket_id
exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    if (ticket.status !== 'open') {
      return res.status(409).json({
        error: { code: 'TICKET_NOT_OPEN', message: 'Only open tickets can be edited or have photo changed.' },
      });
    }

    // Reporter check
    if (req.user && ticket.reported_by !== req.user.email_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only ticket reporter or admin can edit this ticket' } });
    }

    const { title, description, location, issue_type_id, remove_photo } = req.body;

    if (issue_type_id) {
      const issueType = await IssueType.findOne({ issue_type_id });
      if (issueType) {
        ticket.issue_type_id = issue_type_id;
        ticket.issue_type_name = issueType.name;
      }
    }

    if (title) ticket.title = title.trim();
    if (description) ticket.description = description.trim();
    if (location) ticket.location = location.trim();

    if (remove_photo === 'true' || remove_photo === true) {
      ticket.photo = undefined;
    } else if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://${req.headers.host || 'localhost:5000'}`;
      ticket.photo = {
        file_id: `PHO-${Date.now().toString(36).toUpperCase()}`,
        filename: req.file.originalname,
        content_type: req.file.mimetype,
        size_bytes: req.file.size,
        url: `${baseUrl}/uploads/${req.file.filename}`,
      };
    }

    ticket.timeline.push({
      status: 'Updated',
      note: 'Complaint details edited by student',
      actor_name: req.user ? req.user.name : ticket.reported_by_name,
      actor_role: req.user ? req.user.role : 'student',
      timestamp: new Date(),
      image_url: ticket.photo ? ticket.photo.url : undefined,
    });

    await ticket.save();
    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// DELETE /api/v1/fixit/tickets/:ticket_id
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    if (req.user) {
      const isCM = (req.user.role === 'office_staff' && req.user.dept && req.user.dept.toLowerCase().includes('maintenance')) || req.user.role === 'admin';
      const isOwner = ticket.reported_by === req.user.email_id;

      if (!isCM && (!isOwner || ticket.status !== 'open')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this ticket.' },
        });
      }
    }

    await Ticket.deleteOne({ ticket_id: req.params.ticket_id });
    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/fixit/tickets/:ticket_id/photo
exports.getTicketPhoto = async (req, res) => {
  try {
    const { type = 'defect', download } = req.query; // type: 'defect' | 'resolution'
    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    const targetPhoto = type === 'resolution' ? ticket.resolution_photo : ticket.photo;
    if (!targetPhoto || !targetPhoto.url) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `${type === 'resolution' ? 'Resolution' : 'Complaint'} photo not found` },
      });
    }

    const filename = path.basename(targetPhoto.url);
    const filePath = path.join(__dirname, '../../uploads', filename);
    const ext = path.extname(filename) || '.jpg';
    const downloadName = `${ticket.ticket_id}-${type === 'resolution' ? 'resolution-proof' : 'defect'}${ext}`;

    if (download === 'true' || download === '1') {
      if (fs.existsSync(filePath)) {
        return res.download(filePath, downloadName);
      }
      return res.redirect(targetPhoto.url);
    }

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    } else {
      return res.redirect(targetPhoto.url);
    }
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// GET /api/v1/fixit/tickets/:ticket_id/download-photo
exports.downloadTicketPhoto = async (req, res) => {
  try {
    const { type = 'defect' } = req.query; // 'defect' | 'resolution'
    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    const targetPhoto = type === 'resolution' ? ticket.resolution_photo : ticket.photo;
    if (!targetPhoto || !targetPhoto.url) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `${type === 'resolution' ? 'Resolution' : 'Complaint'} photo not found for ticket ${ticket.ticket_id}` },
      });
    }

    const filename = path.basename(targetPhoto.url);
    const filePath = path.join(__dirname, '../../uploads', filename);
    const ext = path.extname(filename) || '.jpg';
    const downloadName = `${ticket.ticket_id}-${type === 'resolution' ? 'resolution-proof' : 'defect'}${ext}`;

    if (fs.existsSync(filePath)) {
      return res.download(filePath, downloadName);
    } else {
      return res.redirect(targetPhoto.url);
    }
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// PUT /api/v1/fixit/tickets/:ticket_id/status (Campus Maintenance)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status || !['open', 'resolved'].includes(status)) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Status must be "open" or "resolved"', details: [{ field: 'status' }] },
      });
    }

    if (!note || note.trim().length < 1 || note.trim().length > 280) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Note is required and must be between 1 and 280 characters', details: [{ field: 'note' }] },
      });
    }

    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    // Optional proof photo on status change
    let proofUrl = undefined;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `http://${req.headers.host || 'localhost:5000'}`;
      proofUrl = `${baseUrl}/uploads/${req.file.filename}`;
      ticket.resolution_photo = {
        file_id: `RES-${Date.now().toString(36).toUpperCase()}`,
        filename: req.file.originalname,
        content_type: req.file.mimetype,
        size_bytes: req.file.size,
        url: proofUrl,
      };
    }

    const updaterEmail = req.user ? req.user.email_id : 'kumar@team21.com';
    const updaterName = req.user ? req.user.name : 'Campus Maintenance';

    ticket.status = status;
    ticket.update = {
      note: note.trim(),
      updated_by: updaterEmail,
      updated_by_name: updaterName,
      updated_at: new Date(),
    };

    ticket.timeline.push({
      status: status === 'resolved' ? 'Completed / Resolved' : 'In Progress',
      note: note.trim(),
      actor_name: updaterName,
      actor_role: req.user ? req.user.role : 'office_staff',
      timestamp: new Date(),
      image_url: proofUrl,
    });

    await ticket.save();

    // Notify student
    await Notification.create({
      recipient_email: ticket.reported_by,
      title: status === 'resolved' ? 'Ticket Resolved!' : 'Maintenance Update on Your Ticket',
      message: `[${ticket.ticket_id}] ${note.trim()}`,
      ticket_id: ticket.ticket_id,
      type: 'status_updated',
    });

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// POST /api/v1/fixit/tickets/:ticket_id/acknowledge (Reporter confirms fix)
exports.acknowledgeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    if (ticket.status === 'open') {
      return res.status(409).json({
        error: { code: 'NOT_RESOLVED', message: 'Cannot acknowledge a ticket that is not yet resolved.' },
      });
    }

    if (ticket.status === 'acknowledged') {
      return res.status(409).json({
        error: { code: 'ALREADY_ACKNOWLEDGED', message: 'This ticket has already been acknowledged and closed.' },
      });
    }

    ticket.status = 'acknowledged';
    ticket.acknowledged_at = new Date();

    const actorName = req.user ? req.user.name : ticket.reported_by_name;
    ticket.timeline.push({
      status: 'Acknowledged',
      note: 'Reporter confirmed resolution. Ticket closed successfully.',
      actor_name: actorName,
      actor_role: 'student',
      timestamp: new Date(),
    });

    await ticket.save();

    // Notify CM
    await Notification.create({
      recipient_email: 'cm@team21.com',
      title: 'Ticket Closed & Acknowledged',
      message: `Student acknowledged resolution for [${ticket.ticket_id}]: ${ticket.title}`,
      ticket_id: ticket.ticket_id,
      type: 'acknowledged',
    });

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// PUT /api/v1/fixit/tickets/:ticket_id/tat (Campus Maintenance sets Turnaround Time)
exports.setTurnaroundTime = async (req, res) => {
  try {
    const { expected_by, note } = req.body;

    if (!expected_by) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'expected_by date (YYYY-MM-DD) is required', details: [{ field: 'expected_by' }] },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    if (expected_by < today) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'expected_by cannot be in the past', details: [{ field: 'expected_by' }] },
      });
    }

    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    if (ticket.status !== 'open') {
      return res.status(409).json({
        error: { code: 'TICKET_RESOLVED', message: 'A resolved ticket cannot get a turnaround time. Reopen it first.' },
      });
    }

    const updaterEmail = req.user ? req.user.email_id : 'kumar@team21.com';
    ticket.tat = {
      expected_by,
      note: note ? note.trim() : 'Work scheduled',
      updated_by: updaterEmail,
      updated_at: new Date(),
    };

    ticket.timeline.push({
      status: 'Turnaround Time Scheduled',
      note: `Expected resolution by ${expected_by}. ${note ? `Note: ${note}` : ''}`,
      actor_name: req.user ? req.user.name : 'Campus Maintenance',
      actor_role: 'office_staff',
      timestamp: new Date(),
    });

    await ticket.save();

    // Notify reporter
    await Notification.create({
      recipient_email: ticket.reported_by,
      title: 'Estimated Resolution Date Set',
      message: `Expected fix date for [${ticket.ticket_id}]: ${expected_by}`,
      ticket_id: ticket.ticket_id,
      type: 'tat_updated',
    });

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

// POST /api/v1/fixit/tickets/:ticket_id/assign (Wireframe Page 7: Assign CM)
exports.assignTicket = async (req, res) => {
  try {
    const { cm_email } = req.body;
    if (!cm_email) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'cm_email is required', details: [{ field: 'cm_email' }] },
      });
    }

    const cmStaff = await User.findOne({
      email_id: cm_email.toLowerCase().trim(),
      role: 'office_staff',
      dept: /campus maintenance/i,
    });

    if (!cmStaff) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Campus Maintenance staff member not found with this email' },
      });
    }

    const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id });
    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    ticket.assigned_to = {
      email_id: cmStaff.email_id,
      name: cmStaff.name,
      designation: cmStaff.designation || 'Technician',
      phone_number: cmStaff.phone_number,
      assigned_at: new Date(),
      assigned_by: req.user ? req.user.email_id : 'admin@team21.com',
    };

    ticket.timeline.push({
      status: 'Assigned to Maintenance',
      note: `Assigned to ${cmStaff.name} (${cmStaff.designation || 'Technician'})`,
      actor_name: req.user ? req.user.name : 'Admin',
      actor_role: req.user ? req.user.role : 'admin',
      timestamp: new Date(),
    });

    await ticket.save();

    // Send notification to the assigned staff
    await Notification.create({
      recipient_email: cmStaff.email_id,
      title: 'New Maintenance Task Assigned to You',
      message: `You were assigned to ticket [${ticket.ticket_id}]: ${ticket.title} in ${ticket.location}`,
      ticket_id: ticket.ticket_id,
      type: 'assigned',
    });

    return res.status(200).json(ticket);
  } catch (error) {
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
