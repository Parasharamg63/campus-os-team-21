const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Auth endpoints as specified in CampusOS API Guide
router.post('/admin/login', authController.adminLogin);
router.post('/login', authController.userLogin);

module.exports = router;
