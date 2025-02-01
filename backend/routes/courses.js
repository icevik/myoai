const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, admin } = require('../middleware/auth');

// Tüm dersleri getir
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ders ekle (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, category, apiConfig } = req.body;
    
    const course = new Course({
      code,
      category,
      apiConfig
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu ders kodu zaten kullanımda' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ders güncelle (Admin only)
router.put('/:code', protect, admin, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    res.json(course);
  } catch (error) {
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
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategoriye göre dersleri getir
router.get('/category/:category', protect, async (req, res) => {
  try {
    const courses = await Course.find({ category: req.params.category });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 