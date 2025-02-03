const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

// Tüm kategorileri getir
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find().sort('code');
    res.json(categories);
  } catch (error) {
    console.error('Kategoriler yüklenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategori ekle (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, name, description } = req.body;
    
    const category = new Category({
      code,
      name,
      description
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bu kategori kodu zaten kullanımda' });
    }
    console.error('Kategori eklenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategori güncelle (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    res.json(category);
  } catch (error) {
    console.error('Kategori güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kategori sil (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    res.json({ message: 'Kategori başarıyla silindi' });
  } catch (error) {
    console.error('Kategori silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 