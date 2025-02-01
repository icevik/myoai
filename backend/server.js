const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Route'ları import et
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// Environment variables
dotenv.config();

// Express app
const app = express();

// CORS ayarları
app.use(cors({
  origin: ['http://34.28.93.220:3000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['x-new-token']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url === '/api/auth/login') {
    console.log('Login isteği:', req.body.email);
  }
  next();
});

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });
    
    console.log('MongoDB bağlantısı başarılı');
    
    // Veritabanı bağlantısı başarılı olduktan sonra koleksiyonları kontrol et
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Mevcut koleksiyonlar:', collections.map(c => c.name));
    
    // users koleksiyonunu kontrol et
    const users = await conn.connection.db.collection('users').find({}).toArray();
    console.log('Mevcut kullanıcılar:', users.length);
    
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  }
};

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route'ları kullan
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Hata:', err);
  res.status(500).json({ 
    message: 'Sunucu hatası', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Server'ı başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 