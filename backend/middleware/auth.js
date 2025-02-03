const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Koruma middleware'i
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar');
      
      // userId yerine id kullanıyoruz
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token süresi doldu' });
      }
      return res.status(401).json({ message: 'Geçersiz token' });
    }
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin kontrolü middleware'i
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
};

module.exports = { protect, admin }; 