const express = require('express');
const router = express.Router();
const axios = require('axios');
const Course = require('../models/Course');
const Conversation = require('../models/Conversation');
const { protect, admin } = require('../middleware/auth');

// Konuşma başlat veya devam ettir
router.post('/:courseCode', protect, async (req, res) => {
  try {
    const course = await Course.findOne({ code: req.params.courseCode });
    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    // API'ye istek gönder
    const response = await axios.post(
      `${course.apiConfig.host}${course.apiConfig.chatbotId}`,
      { question: req.body.message },
      { headers: { Authorization: `Bearer ${course.apiConfig.securityKey}` } }
    );

    // Konuşmayı bul veya oluştur
    let conversation = await Conversation.findOne({
      userId: req.user.id,
      courseCode: req.params.courseCode
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.user.id,
        courseCode: req.params.courseCode,
        messages: []
      });
    }

    // Mesajları ekle
    conversation.messages.push(
      { role: 'user', content: req.body.message },
      { role: 'bot', content: response.data }
    );

    await conversation.save();
    res.json(response.data);
  } catch (error) {
    console.error('Chat hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşma geçmişini getir (Admin için tüm konuşmalar)
router.get('/conversations', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const conversations = await Conversation.find(query)
      .populate('userId', 'name email')
      .sort('-lastMessageAt');
    res.json(conversations);
  } catch (error) {
    console.error('Konuşma geçmişi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli bir konuşmanın detaylarını getir
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('userId', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    // Admin değilse sadece kendi konuşmalarını görebilir
    if (req.user.role !== 'admin' && conversation.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Bu konuşmaya erişim izniniz yok' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Konuşma detayı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşma sil (Admin only)
router.delete('/conversations/:id', protect, admin, async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }
    res.json({ message: 'Konuşma başarıyla silindi' });
  } catch (error) {
    console.error('Konuşma silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 