const express = require('express');
const router = express.Router();
const { verifyGovtId, getProfile, updateProfile } = require('../controllers/usercontroller');
const authenticate = require('../middleware/authMiddleware');

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/verify-id', authenticate, verifyGovtId);

module.exports = router;
