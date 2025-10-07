const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  joinCampaign,
  donateToCampaign
} = require('../controllers/campaignController');

const authenticate = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);

// Protected routes
router.post('/', authenticate, createCampaign);
router.post('/:id/join', authenticate, joinCampaign);
router.post('/:id/donate', authenticate, donateToCampaign);

module.exports = router;
