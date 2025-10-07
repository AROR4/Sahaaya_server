const Campaign = require('../models/Campaign');
const User = require('../models/user');

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      about,
      category,
      location,
      date,
      image_url,
      estimatedBudget,
      targetParticipants,
      contact,
      documents,
      isNgoAffiliated,
      ngoDetails
    } = req.body;

    const userId = req.user.id;

    const campaign = await Campaign.create({
      title,
      description,
      about,
      category,
      location,
      date,
      image_url,
      estimatedBudget,
      targetParticipants,
      contact,           // { email, phone }
      documents,         // array of doc URLs
      isNgoAffiliated,
      ngoDetails,        // { name, location }
      creator: userId,
    });

    // Link campaign to user
    await User.findByIdAndUpdate(userId, {
      $push: { createdCampaigns: campaign._id },
    });

    res.status(201).json(campaign);
  } catch (err) {
    console.error('Create campaign error:', err.message);
    res.status(500).json({ message: 'Failed to create campaign', error: err.message });
  }
};

// Get all campaigns
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('creator', 'name email picture role')
      .populate('participants', 'name email picture')
      .sort({ createdAt: -1 });

    // If user is authenticated, mark which campaigns they've joined
    if (req.user) {
      const userId = req.user._id;
      const campaignsWithJoinStatus = campaigns.map(campaign => ({
        ...campaign.toObject(),
        isJoined: campaign.participants.some(participant => 
          participant._id.toString() === userId.toString()
        )
      }));
      return res.status(200).json(campaignsWithJoinStatus);
    }

    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err.message);
    res.status(500).json({ message: 'Failed to fetch campaigns', error: err.message });
  }
};


// Get a single campaign
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email picture role')
      .populate('participants', 'name email picture')
      .populate('donations.user', 'name email picture');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // If user is authenticated, mark if they've joined this campaign
    if (req.user) {
      const userId = req.user._id;
      const campaignObj = campaign.toObject();
      campaignObj.isJoined = campaign.participants.some(participant => 
        participant._id.toString() === userId.toString()
      );
      return res.status(200).json(campaignObj);
    }

    res.status(200).json(campaign);
  } catch (err) {
    console.error('Error fetching campaign:', err.message);
    res.status(500).json({ message: 'Failed to fetch campaign', error: err.message });
  }
};


// Join a campaign
exports.joinCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    const userId = req.user._id;

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Ensure only approved campaigns can be joined
    if (campaign.status !== 'approved') {
      return res.status(403).json({ message: 'You can only join approved campaigns' });
    }

    // Prevent duplicate joins
    if (campaign.participants.includes(userId)) {
      return res.status(400).json({ message: 'Already joined this campaign' });
    }

    // Add participant
    campaign.participants.push(userId);

    // Recalculate popularity score
    const participantCount = campaign.participants.length;
    const target = campaign.targetParticipants || 1;
    campaign.popularity_score = Math.round((participantCount / target) * 100);

    // Save campaign
    await campaign.save();

    // Add campaign to user's joinedCampaigns
    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedCampaigns: campaign._id },
    });

    res.status(200).json({
      message: 'Successfully joined the campaign',
      updatedScore: campaign.popularity_score,
    });

  } catch (err) {
    console.error('Join campaign error:', err.message);
    res.status(500).json({ message: 'Failed to join campaign', error: err.message });
  }
};

// Donate to a campaign (creates a pending donation entry)
exports.donateToCampaign = async (req, res) => {
  try {
    const { amount, goalId, upiId } = req.body;
    const campaignId = req.params.id;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid donation amount' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Ensure only approved campaigns can receive donations
    if (campaign.status !== 'approved') {
      return res.status(403).json({ message: 'You can only donate to approved campaigns' });
    }

    // Add donation to campaign (pending until admin confirms receipt)
    const donation = {
      user: userId,
      amount: amount,
      upiId: upiId || null,
      status: 'pending',
      date: new Date()
    };

    campaign.donations.push(donation);

    // Save campaign
    await campaign.save();

    res.status(200).json({
      message: 'Donation recorded and pending confirmation',
      donation: donation
    });

  } catch (err) {
    console.error('Donate to campaign error:', err.message);
    res.status(500).json({ message: 'Failed to process donation', error: err.message });
  }
};


