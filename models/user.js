const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  picture: String,

  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },

  authProvider: { type: String, default: 'google' },

  createdCampaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }],

  joinedCampaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }],

  govtIdUrl: {
    type: String,
    default: null
  },

  isGovtIdVerified: {
    type: Boolean,
    default: false
  },

  totalDonated: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
