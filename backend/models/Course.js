const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Doküman başlığı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'Doküman URL zorunludur']
  },
  fileType: {
    type: String,
    required: [true, 'Dosya tipi zorunludur']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

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
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Geçerli bir API host adresi giriniz (http:// veya https:// ile başlamalı)'
      }
    },
    chatbotId: {
      type: String
    },
    securityKey: {
      type: String
    }
  },
  documents: [documentSchema],
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  if (!this.isActive) return false;
  if (!userId) return false;

  if (this.isPublic) return true;
  return this.allowedUsers.some(id => id.toString() === userId.toString());
};

// Pre-save middleware
courseSchema.pre('save', function(next) {
  // API yapılandırması tam ise ve status draft/pending ise active yap
  if (this.isApiConfigComplete() && ['draft', 'pending'].includes(this.status)) {
    this.status = 'active';
    this.isActive = true;
  }

  // Tarih alanlarını güncelle
  this.updatedAt = new Date();
  if (!this.createdAt) {
    this.createdAt = new Date();
  }

  next();
});

module.exports = mongoose.model('Course', courseSchema); 