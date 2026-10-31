const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const issueTypeController = require('../controllers/issueTypeController');
const { optionalAuth, verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Issue Types endpoints (/api/v1/fixit/issue-types)
router.get('/issue-types', issueTypeController.getIssueTypes);
router.get('/issue-types/:id', issueTypeController.getIssueTypeById);
router.post('/issue-types', optionalAuth, issueTypeController.createIssueType);
router.patch('/issue-types/:id', optionalAuth, issueTypeController.updateIssueType);
router.delete('/issue-types/:id', optionalAuth, issueTypeController.deleteIssueType);

// Public / Easy Track lookup endpoint (for Quick Track by Track ID)
router.get('/tickets/track/:ticket_id', ticketController.trackTicketById);

// Tickets endpoints (/api/v1/fixit/tickets)
router.post('/tickets', optionalAuth, upload.single('photo'), ticketController.createTicket);
router.get('/tickets', optionalAuth, ticketController.listTickets);
router.get('/tickets/:ticket_id', optionalAuth, ticketController.getTicket);
router.patch('/tickets/:ticket_id', optionalAuth, upload.single('photo'), ticketController.updateTicket);
router.delete('/tickets/:ticket_id', optionalAuth, ticketController.deleteTicket);
router.get('/tickets/:ticket_id/photo', ticketController.getTicketPhoto);
router.get('/tickets/:ticket_id/download-photo', ticketController.downloadTicketPhoto);

// Status update by Campus Maintenance / Admin
router.put('/tickets/:ticket_id/status', optionalAuth, upload.single('photo'), ticketController.updateStatus);

// Acknowledge by reporter
router.post('/tickets/:ticket_id/acknowledge', optionalAuth, ticketController.acknowledgeTicket);

// Turnaround time (TAT)
router.put('/tickets/:ticket_id/tat', optionalAuth, ticketController.setTurnaroundTime);

// Assign CM staff
router.post('/tickets/:ticket_id/assign', optionalAuth, ticketController.assignTicket);

module.exports = router;
