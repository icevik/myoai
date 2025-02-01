const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Lütfen giriş yapın' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      }

      if (!user.isApproved && user.role !== 'admin') {
        return res.status(401).json({ message: 'Hesabınız henüz onaylanmamış' });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Oturum süresi doldu', expired: true });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Geçersiz token' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Lütfen giriş yapın' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli' });
  }
  
  next();
}; 