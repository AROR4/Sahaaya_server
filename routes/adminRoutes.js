const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  approveCampaign,
  rejectCampaign,
  getDashboardStats,
  markDonationReceived
} = require('../controllers/adminController');

const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeAdmin);

// Admin routes
router.get('/campaigns', getAllCampaigns);
router.get('/stats', getDashboardStats);
router.put('/campaigns/:id/approve', approveCampaign);
router.put('/campaigns/:id/reject', rejectCampaign);
router.put('/campaigns/:id/donations/:donationId/received', markDonationReceived);

module.exports = router;
