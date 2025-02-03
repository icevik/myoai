const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.method !== 'OPTIONS') {
    console.log('Body:', req.body);
  }
  next();
});

// Middleware
app.use(cors({
  origin: ['http://34.136.154.58:3000', 'http://34.136.154.58'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['x-new-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const chatRoutes = require('./routes/chat');
const categoriesRoutes = require('./routes/categories');
const monitoringRoutes = require('./routes/monitoring');
const reportsRoutes = require('./routes/reports');

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({ message: 'Sunucu hatası', error: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route bulunamadı: ${req.originalUrl}`);
  res.status(404).json({ message: 'Route bulunamadı' });
});

module.exports = app; 