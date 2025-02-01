const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');

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

// Admin kullanıcısı oluşturma fonksiyonu
const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@yeditepe.edu.tr';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isApproved: true
      });
      
      await adminUser.save();
      console.log('Admin kullanıcısı oluşturuldu');
    }
  } catch (err) {
    console.error('Admin kullanıcısı oluşturulurken hata:', err);
  }
};

// Uygulama başladığında admin kullanıcısını oluştur
createAdminUser();

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
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Debug için gelen isteği logla
    console.log('Login isteği:', req.body);

    // Validasyon kontrolü
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validasyon hataları:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    console.log('Bulunan kullanıcı:', user ? {
      id: user._id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      loginAttempts: user.loginAttempts,
      lockUntil: user.lockUntil
    } : null);

    if (!user) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }

    // Hesap kilitli mi kontrol et
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      console.log('Hesap kilitli:', { lockTime });
      return res.status(401).json({ 
        message: `Hesabınız kilitlendi. ${lockTime} dakika sonra tekrar deneyin.` 
      });
    }

    // Hesap onaylı mı kontrol et
    if (!user.isApproved) {
      console.log('Hesap onaylı değil');
      return res.status(401).json({ message: 'Hesabınız henüz onaylanmamış' });
    }

    // Şifre kontrolü
    console.log('Şifre kontrolü yapılıyor...');
    const isMatch = await user.comparePassword(password);
    console.log('Şifre eşleşmesi:', isMatch);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      console.log('Başarısız giriş denemesi:', {
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil
      });
      
      if (user.isLocked()) {
        return res.status(401).json({ 
          message: 'Çok fazla başarısız deneme. Hesabınız 1 saat süreyle kilitlendi.' 
        });
      }
      
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }

    // Başarılı giriş
    await user.successfulLogin();
    console.log('Başarılı giriş');
    
    // Token oluştur
    const token = generateToken(user);

    // Kullanıcı bilgilerini gönder
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kayıt talebi
router.post('/register-request', registerValidation, async (req, res) => {
  try {
    // Validasyon kontrolü
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // E-posta kullanımda mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda' });
    }

    // Admin e-postası kontrolü
    if (email === process.env.ADMIN_EMAIL) {
      const user = new User({
        name,
        email,
        password,
        role: 'admin',
        isApproved: true
      });
      await user.save();
      return res.status(201).json({ message: 'Admin hesabı oluşturuldu' });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      name,
      email,
      password
    });
    await user.save();

    res.status(201).json({ message: 'Kayıt talebiniz alındı. Admin onayı bekleniyor.' });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda' });
    }
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

module.exports = router; 