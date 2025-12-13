const Acknowledgement = require('../models/Acknowledgement');
const Campaign = require('../models/Campaign');

// Generate acknowledgement for a campaign
exports.generateAcknowledgement = async (req, res) => {
  try {
    const { campaignId, message } = req.body;
    const userId = req.user._id;

    // Find the campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if campaign is NGO affiliated
    if (!campaign.isNgoAffiliated || !campaign.ngoDetails) {
      return res.status(400).json({ 
        message: 'Acknowledgements can only be generated for NGO-affiliated campaigns' 
      });
    }

    // Check if user is the campaign creator
    if (campaign.creator.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Only the campaign creator can generate acknowledgements' 
      });
    }

    // Check if acknowledgement already exists
    const existingAcknowledgement = await Acknowledgement.findOne({ campaign: campaignId });
    if (existingAcknowledgement) {
      return res.status(400).json({ 
        message: 'Acknowledgement already exists for this campaign',
        acknowledgement: existingAcknowledgement
      });
    }

    // Create acknowledgement
    const acknowledgement = await Acknowledgement.create({
      campaign: campaignId,
      ngoName: campaign.ngoDetails.name,
      ngoLocation: campaign.ngoDetails.location,
      message: message || 'We sincerely thank all participants and donors for their valuable contribution to this campaign.',
      generatedBy: userId,
      status: 'draft'
    });

    res.status(201).json({
      message: 'Acknowledgement generated successfully',
      acknowledgement
    });
  } catch (err) {
    console.error('Generate acknowledgement error:', err.message);
    res.status(500).json({ 
      message: 'Failed to generate acknowledgement', 
      error: err.message 
    });
  }
};

// Get acknowledgement for a campaign
exports.getAcknowledgementByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const acknowledgement = await Acknowledgement.findOne({ campaign: campaignId })
      .populate('campaign', 'title description')
      .populate('generatedBy', 'name email');

    if (!acknowledgement) {
      return res.status(404).json({ message: 'Acknowledgement not found for this campaign' });
    }

    res.status(200).json(acknowledgement);
  } catch (err) {
    console.error('Get acknowledgement error:', err.message);
    res.status(500).json({ 
      message: 'Failed to fetch acknowledgement', 
      error: err.message 
    });
  }
};

// Get all acknowledgements for an NGO (by user)
exports.getAcknowledgementsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const acknowledgements = await Acknowledgement.find({ generatedBy: userId })
      .populate('campaign', 'title description category status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: acknowledgements.length,
      acknowledgements
    });
  } catch (err) {
    console.error('Get acknowledgements error:', err.message);
    res.status(500).json({ 
      message: 'Failed to fetch acknowledgements', 
      error: err.message 
    });
  }
};

// Publish an acknowledgement
exports.publishAcknowledgement = async (req, res) => {
  try {
    const { acknowledgementId } = req.params;
    const userId = req.user._id;

    const acknowledgement = await Acknowledgement.findById(acknowledgementId);
    if (!acknowledgement) {
      return res.status(404).json({ message: 'Acknowledgement not found' });
    }

    // Check if user is the creator
    if (acknowledgement.generatedBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Only the creator can publish this acknowledgement' 
      });
    }

    acknowledgement.status = 'published';
    acknowledgement.publishedAt = new Date();
    await acknowledgement.save();

    res.status(200).json({
      message: 'Acknowledgement published successfully',
      acknowledgement
    });
  } catch (err) {
    console.error('Publish acknowledgement error:', err.message);
    res.status(500).json({ 
      message: 'Failed to publish acknowledgement', 
      error: err.message 
    });
  }
};

// Update acknowledgement message
exports.updateAcknowledgement = async (req, res) => {
  try {
    const { acknowledgementId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const acknowledgement = await Acknowledgement.findById(acknowledgementId);
    if (!acknowledgement) {
      return res.status(404).json({ message: 'Acknowledgement not found' });
    }

    // Check if user is the creator
    if (acknowledgement.generatedBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Only the creator can update this acknowledgement' 
      });
    }

    acknowledgement.message = message;
    await acknowledgement.save();

    res.status(200).json({
      message: 'Acknowledgement updated successfully',
      acknowledgement
    });
  } catch (err) {
    console.error('Update acknowledgement error:', err.message);
    res.status(500).json({ 
      message: 'Failed to update acknowledgement', 
      error: err.message 
    });
  }
};

