const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'İsim alanı zorunludur'],
    trim: true,
    minlength: [2, 'İsim en az 2 karakter olmalıdır'],
    maxlength: [50, 'İsim en fazla 50 karakter olabilir']
  },
  email: {
    type: String,
    required: [true, 'E-posta alanı zorunludur'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/@(std\.)?yeditepe\.edu\.tr$/, 'Geçerli bir Yeditepe e-posta adresi giriniz']
  },
  password: {
    type: String,
    required: [true, 'Şifre alanı zorunludur'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır']
  },
  role: {
    type: String,
    enum: {
      values: ['student', 'admin'],
      message: 'Geçersiz rol'
    },
    default: 'student'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
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

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
  // Şifre değişmediyse veya yeni kayıt değilse
  if (!this.isModified('password')) return next();
  
  try {
    // Şifre güvenlik seviyesi kontrolü
    if (this.password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır');
    }
    
    // Şifreyi hashle
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Şifre karşılaştırma hatası');
  }
};

// Hesap kilitli mi kontrolü
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Giriş denemesi başarısız olduğunda
userSchema.methods.incrementLoginAttempts = async function() {
  // Kilit süresi geçmişse
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: {
        loginAttempts: 1,
        lockUntil: null
      }
    });
  }
  
  // Kilit süresi devam ediyorsa
  const updates = {
    $inc: { loginAttempts: 1 }
  };
  
  // 5 başarısız deneme sonrası hesabı kilitle (1 saat)
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = {
      lockUntil: Date.now() + 3600000 // 1 saat
    };
  }
  
  return await this.updateOne(updates);
};

// Başarılı giriş sonrası
userSchema.methods.successfulLogin = async function() {
  return await this.updateOne({
    $set: {
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date()
    }
  });
};

module.exports = mongoose.model('User', userSchema); 