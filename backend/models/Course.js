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
  welcomeMessage: {
    type: String,
    default: 'Merhaba! Size nasıl yardımcı olabilirim?'
  },
  apiConfig: {
    host: {
      type: String,
      required: [true, 'API host adresi zorunludur'],
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Geçerli bir API host adresi giriniz (http:// veya https:// ile başlamalı)'
      }
    },
    chatbotId: {
      type: String,
      required: [true, 'Chatbot ID zorunludur']
    },
    securityKey: {
      type: String,
      required: [true, 'API güvenlik anahtarı zorunludur']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// API yapılandırmasının tam olup olmadığını kontrol et
courseSchema.methods.isApiConfigComplete = function() {
  return this.apiConfig &&
         this.apiConfig.host &&
         this.apiConfig.chatbotId &&
         this.apiConfig.securityKey;
};

// Kullanıcının kursa erişim izni var mı kontrol et
courseSchema.methods.hasAccess = function(userId) {
  return this.isActive && (
    this.isPublic || 
    this.allowedUsers.includes(userId)
  );
};

module.exports = mongoose.model('Course', courseSchema); 