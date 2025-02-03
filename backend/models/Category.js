const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Kategori kodu zorunludur'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Kategori adı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema); 