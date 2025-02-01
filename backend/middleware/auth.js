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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Token'ın süresinin dolmasına 1 saatten az kaldıysa yenile
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (tokenExp - now < oneHour) {
        const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
          expiresIn: '1d'
        });
        res.setHeader('X-New-Token', newToken);
      }

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      }

      if (!user.isApproved) {
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
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli' });
  }
}; 