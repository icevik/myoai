const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');

// Route'ları import et
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// Environment variables
dotenv.config();

// Admin kullanıcısı oluşturma fonksiyonu
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yeditepe.edu.tr';
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

// Express app
const app = express();

// CORS ayarları - daha esnek
app.use(cors({
  origin: true, // Tüm originlere izin ver
  credentials: true,
  exposedHeaders: ['x-new-token']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB bağlantısı başarılı');
    
    // MongoDB bağlantısı başarılı olduktan sonra admin kullanıcısını oluştur
    await createAdminUser();
    
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  }
};

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Route'ları kullan - /api prefix'i olmadan
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/chat', chatRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Hata:', err);
  res.status(500).json({ message: 'Sunucu hatası' });
});

// Server'ı başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 