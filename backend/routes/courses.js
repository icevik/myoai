const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');
const fetch = require('node-fetch');

// Tüm dersleri getir
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('category', 'code name')
      .sort('code');
    res.json(courses);
  } catch (error) {
    console.error('Dersler yüklenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// API bağlantısını test et
router.post('/test-api', protect, async (req, res) => {
  try {
    const { host, chatbotId, securityKey } = req.body;
    
    // Test isteği gönder
    const response = await fetch(`${host}/api/v1/prediction/${chatbotId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${securityKey}`
      },
      body: JSON.stringify({ question: 'Test message' })
    });

    if (!response.ok) {
      throw new Error(`API yanıt vermedi: ${response.status}`);
    }

    const data = await response.json();
    res.json({ message: 'API bağlantısı başarılı', data });
  } catch (error) {
    console.error('API test edilirken hata:', error);
    res.status(400).json({ message: 'API bağlantısı başarısız: ' + error.message });
  }
});

// Ders ekle (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, name, category, apiConfig } = req.body;

    // API bağlantısını test et
    try {
      const response = await fetch(`${apiConfig.host}/api/v1/prediction/${apiConfig.chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.securityKey}`
        },
        body: JSON.stringify({ question: 'Test message' })
      });

      if (!response.ok) {
        throw new Error(`API yanıt vermedi: ${response.status}`);
      }
    } catch (error) {
      return res.status(400).json({ 
        message: 'API yapılandırması geçersiz',
        error: error.message 
      });
    }

    // Kategori kontrolü
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Geçersiz kategori' });
    }

    const course = new Course({
      code,
      name,
      category,
      apiConfig
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Ders eklenirken hata:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu ders kodu zaten kullanımda' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ders güncelle (Admin only)
router.put('/:code', protect, admin, async (req, res) => {
  try {
    const { category } = req.body;
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Geçersiz kategori' });
      }
    }

    const course = await Course.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'code name');

    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    res.json(course);
  } catch (error) {
    console.error('Ders güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ders sil (Admin only)
router.delete('/:code', protect, admin, async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ code: req.params.code });
    
    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    res.json({ message: 'Ders başarıyla silindi' });
  } catch (error) {
    console.error('Ders silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategoriye göre dersleri getir
router.get('/category/:categoryId', protect, async (req, res) => {
  try {
    const courses = await Course.find({ category: req.params.categoryId })
      .populate('category', 'code name')
      .sort('code');
    res.json(courses);
  } catch (error) {
    console.error('Dersler yüklenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 