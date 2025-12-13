const express = require('express');
const router = express.Router();
const {
  generateAcknowledgement,
  getAcknowledgementByCampaign,
  getAcknowledgementsByUser,
  publishAcknowledgement,
  updateAcknowledgement
} = require('../controllers/acknowledgementController');

const authenticate = require('../middleware/authMiddleware');

// Protected routes
router.post('/generate', authenticate, generateAcknowledgement);
router.get('/campaign/:campaignId', getAcknowledgementByCampaign); // Public route
router.get('/my-acknowledgements', authenticate, getAcknowledgementsByUser);
router.put('/:acknowledgementId/publish', authenticate, publishAcknowledgement);
router.put('/:acknowledgementId', authenticate, updateAcknowledgement);

module.exports = router;

