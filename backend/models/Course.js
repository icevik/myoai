const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Ders kodu zorunludur'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Ders adı zorunludur'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Kategori zorunludur']
  },
  apiConfig: {
    host: {
      type: String,
      required: [true, 'API host adresi zorunludur']
    },
    chatbotId: {
      type: String,
      required: [true, 'Chatbot ID zorunludur']
    },
    securityKey: {
      type: String,
      required: [true, 'Güvenlik anahtarı zorunludur']
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema); 