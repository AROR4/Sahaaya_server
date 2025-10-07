const User = require('../models/user');
const Campaign = require('../models/Campaign');

exports.verifyGovtId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { govtIdUrl } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      isGovtIdVerified: true,
      govtIdUrl, 
    }, { new: true });

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify ID', error: err.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('createdCampaigns', 'title description category status createdAt')
      .populate('joinedCampaigns', 'title description category status createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, picture, govtIdUrl } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (picture) updateData.picture = picture;
    if (govtIdUrl) updateData.govtIdUrl = govtIdUrl;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

