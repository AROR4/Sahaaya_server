const Campaign = require('../models/Campaign');
const User = require('../models/user');

// Get all campaigns for admin
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('creator', 'name email picture role')
      .populate('participants', 'name email picture')
      .populate('donations.user', 'name email picture')
      .sort({ createdAt: -1 });

    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns for admin:', err.message);
    res.status(500).json({ message: 'Failed to fetch campaigns', error: err.message });
  }
};

// Approve a campaign
exports.approveCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { status: 'approved' },
      { new: true }
    ).populate('creator', 'name email picture role');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({
      message: 'Campaign approved successfully',
      campaign: campaign
    });
  } catch (err) {
    console.error('Approve campaign error:', err.message);
    res.status(500).json({ message: 'Failed to approve campaign', error: err.message });
  }
};

// Reject a campaign
exports.rejectCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { status: 'rejected' },
      { new: true }
    ).populate('creator', 'name email picture role');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({
      message: 'Campaign rejected successfully',
      campaign: campaign
    });
  } catch (err) {
    console.error('Reject campaign error:', err.message);
    res.status(500).json({ message: 'Failed to reject campaign', error: err.message });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const approvedCampaigns = await Campaign.countDocuments({ status: 'approved' });
    const rejectedCampaigns = await Campaign.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments();
    const totalDonations = await Campaign.aggregate([
      { $unwind: '$donations' },
      { $match: { 'donations.status': 'received' } },
      { $group: { _id: null, total: { $sum: '$donations.amount' } } }
    ]);

    const stats = {
      totalCampaigns,
      pendingCampaigns,
      approvedCampaigns,
      rejectedCampaigns,
      totalUsers,
      totalDonations: totalDonations.length > 0 ? totalDonations[0].total : 0
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error('Get dashboard stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
};

// Mark donation as received
exports.markDonationReceived = async (req, res) => {
  try {
    const { id: campaignId, donationId } = req.params;
    const { goalId } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const donation = campaign.donations.id(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (donation.status === 'received') {
      return res.status(400).json({ message: 'Donation already marked as received' });
    }

    donation.status = 'received';

    // Update goal collected amount if provided
    if (goalId) {
      const goal = campaign.goals.id(goalId);
      if (goal) {
        goal.collectedAmount += donation.amount;
      }
    }

    await campaign.save();

    // Increment user's totalDonated
    await User.findByIdAndUpdate(donation.user, { $inc: { totalDonated: donation.amount } });

    res.status(200).json({ message: 'Donation marked as received', donation });
  } catch (err) {
    console.error('Mark donation received error:', err.message);
    res.status(500).json({ message: 'Failed to update donation', error: err.message });
  }
};
