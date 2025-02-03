const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/auth');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '24h';
const TOKEN_REFRESH_THRESHOLD = 60 * 60; // 1 saat

// Token oluşturma fonksiyonu
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// Token kontrol ve yenileme middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Token süresinin dolmasına 1 saatten az kaldıysa yenile
      const tokenExp = decoded.exp * 1000; // Unix timestamp'i milisaniyeye çevir
      const now = Date.now();
      
      if (tokenExp - now < TOKEN_REFRESH_THRESHOLD * 1000) {
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
        }
        
        const newToken = generateToken(user);
        res.setHeader('x-new-token', newToken);
      }

      req.user = decoded;
      next();
      
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Oturum süreniz doldu',
          expired: true 
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Kimlik doğrulama hatası' });
  }
};

// Giriş validasyonları
const loginValidation = [
  check('email')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .matches(/@(std\.)?yeditepe\.edu\.tr$/).withMessage('Geçerli bir Yeditepe e-posta adresi giriniz'),
  check('password')
    .exists().withMessage('Şifre gerekli')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
];

// Kayıt validasyonları
const registerValidation = [
  check('name')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('İsim 2-50 karakter arasında olmalıdır'),
  check('email')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .matches(/@(std\.)?yeditepe\.edu\.tr$/).withMessage('Geçerli bir Yeditepe e-posta adresi giriniz'),
  check('password')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/\d/).withMessage('Şifre en az bir rakam içermelidir')
    .matches(/[a-z]/).withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermelidir')
];

// Giriş
router.post('/login', async (req, res) => {
  try {
    console.log('Giriş isteği alındı:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre zorunludur' });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('Kullanıcı bulunamadı:', normalizedEmail);
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }

    // Hesap kilitli mi kontrol et
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      console.log('Hesap kilitli:', normalizedEmail, lockTime);
      return res.status(401).json({ 
        message: `Hesabınız kilitlendi. ${lockTime} dakika sonra tekrar deneyin.` 
      });
    }

    // Hesap onaylı mı kontrol et
    if (!user.isApproved && user.role !== 'admin') {
      console.log('Hesap onaylanmamış:', normalizedEmail);
      return res.status(401).json({ message: 'Hesabınız henüz onaylanmamış' });
    }

    // Şifre kontrolü
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      console.log('Şifre hatalı:', normalizedEmail);
      
      if (user.isLocked()) {
        return res.status(401).json({ 
          message: 'Çok fazla başarısız deneme. Hesabınız 1 saat süreyle kilitlendi.' 
        });
      }
      
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }

    // Başarılı giriş
    await user.successfulLogin();
    console.log('Başarılı giriş:', normalizedEmail);
    
    // Token oluştur
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Giriş sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Admin kaydı
router.post('/register-admin', async (req, res) => {
  try {
    console.log('Admin kayıt isteği alındı:', req.body);
    const { password, name, email } = req.body;

    // Validasyon
    if (!password || !name || !email) {
      return res.status(400).json({ message: 'İsim, email ve şifre zorunludur' });
    }

    // Email formatı kontrolü
    const emailRegex = /@yeditepe\.edu\.tr$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Sadece Yeditepe email adresleri kabul edilmektedir' });
    }

    // Email kontrolü
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
    }

    // Yeni admin oluştur
    const user = new User({
      password, // Düz metin parola; pre-save hook burada hash yapacak
      name,
      email: email.toLowerCase(),
      role: 'admin',
      isApproved: true
    });

    await user.save();
    console.log('Yeni admin oluşturuldu:', user);

    // Token oluştur
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'gizli-anahtar',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin başarıyla oluşturuldu',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin kaydı sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Normal kullanıcı kaydı
router.post('/register', async (req, res) => {
  try {
    console.log('Kullanıcı kayıt isteği alındı:', req.body);
    const { username, password, name, email } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
    }

    const emailRegex = /@yeditepe\.edu\.tr$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Sadece Yeditepe email adresleri kabul edilmektedir' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı veya email zaten kullanımda' });
    }

    const user = new User({
      username,
      password, // Düz metin parola; pre-save hook burada hash yapacak
      name,
      email: email.toLowerCase(),
      role: 'user'
    });

    await user.save();
    console.log('Yeni kullanıcı oluşturuldu:', user);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Kullanıcı kaydı sırasında hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Kayıt talebi
router.post('/register-request', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda' });
    }

    // Öğrenci e-posta kontrolü
    if (!normalizedEmail.includes('@std.yeditepe.edu.tr')) {
      return res.status(400).json({ message: 'Geçerli bir öğrenci e-posta adresi giriniz' });
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      role: 'student',
      isApproved: false
    });

    await user.save();
    res.status(201).json({ message: 'Kayıt talebiniz alındı. Onay için bekleyiniz.' });
  } catch (err) {
    console.error('Kayıt hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profil bilgilerini getir
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -loginAttempts -lockUntil')
      .populate('courses', 'code name');
      
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre güncelleme
router.put('/change-password', authMiddleware, [
  check('currentPassword').exists().withMessage('Mevcut şifre gerekli'),
  check('newPassword')
    .isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalıdır')
    .matches(/\d/).withMessage('Yeni şifre en az bir rakam içermelidir')
    .matches(/[a-z]/).withMessage('Yeni şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/).withMessage('Yeni şifre en az bir büyük harf içermelidir')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 