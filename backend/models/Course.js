const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['INP', 'MEC', 'AUT', 'ELT']
  },
  apiConfig: {
    host: {
      type: String,
      required: true
    },
    chatbotId: {
      type: String,
      required: true
    },
    securityKey: {
      type: String,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema); 