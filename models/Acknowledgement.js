const mongoose = require('mongoose');

const acknowledgementSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  
  ngoName: {
    type: String,
    required: true
  },
  
  ngoLocation: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true,
    default: 'We sincerely thank all participants and donors for their valuable contribution to this campaign.'
  },
  
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  
  publishedAt: {
    type: Date
  }
  
}, {
  timestamps: true
});

module.exports = mongoose.model('Acknowledgement', acknowledgementSchema);

