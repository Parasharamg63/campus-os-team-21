const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Protected admin routes
router.use(verifyToken, requireAdmin);

router.post('/users', adminController.createUser);
router.get('/users', adminController.listUsers);
router.get('/users/:email_id', adminController.getUser);
router.patch('/users/:email_id', adminController.updateUser);
router.post('/users/:email_id/regenerate-otp', adminController.regenerateOtp);
router.delete('/users/:email_id', adminController.deleteUser);
router.get('/stats', adminController.getStats);

module.exports = router;
