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
  origin: process.env.CORS_ORIGIN || 'http://34.136.154.58:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['x-new-token']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.method !== 'OPTIONS') {
    console.log('Body:', req.body);
  }
  next();
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Route'ları kullan
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/chat', chatRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use((req, res) => {
  console.log('404 - Route bulunamadı:', req.originalUrl);
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({ message: 'Sunucu hatası', error: err.message });
});

// Server'ı başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 