const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  about : {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ['Environment', 'Education', 'Animal Welfare', 'Healthcare', 'Other'],
    default: 'Other'
  },

  location: String,

  date: {
    type: Date,
    required: true
  },

  submittedDate: {
    type: Date,
    default: Date.now
  },

  image_url: String,

  targetParticipants: {
    type: Number,
    required: true
  },

  estimatedBudget: {
    type: Number,
    required: true
  },

  documents: [{
    type: String // array of document URLs
  }],

  contact: {
    phone: { type: String },
    email: { type: String }
  },

  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  verified: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  isNgoAffiliated: {
    type: Boolean,
    default: false
  },

  ngoDetails: {
    name: { type: String },
    location: { type: String }
  },

  popularity_score: {
    type: Number,
    default: 0
  },

  donations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],

  goals: [{
    description: {
      type: String,
      required: true
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    collectedAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  }]

}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);
