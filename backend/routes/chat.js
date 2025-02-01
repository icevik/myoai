const express = require('express');
const router = express.Router();
const axios = require('axios');
const Course = require('../models/Course');
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/auth');

// Yeni mesaj gönder
router.post('/:courseCode', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const course = await Course.findOne({ code: req.params.courseCode });

    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    // Chatbot API'sine istek at
    const response = await axios.post(
      `${course.apiConfig.host}${course.apiConfig.chatbotId}`,
      { question: message },
      { 
        headers: { 
          'Authorization': `Bearer ${course.apiConfig.securityKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Konuşmayı kaydet
    let conversation = await Conversation.findOne({
      userId: req.user.id,
      courseCode: course.code
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.user.id,
        courseCode: course.code,
        messages: []
      });
    }

    // Kullanıcı ve bot mesajlarını ekle
    conversation.messages.push(
      { role: 'user', content: message },
      { role: 'bot', content: response.data.answer }
    );

    await conversation.save();

    res.json({
      message: response.data.answer,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşma geçmişini getir
router.get('/history/:courseCode', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user.id,
      courseCode: req.params.courseCode
    }).sort('-createdAt');

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm konuşmaları getir (Admin only)
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekli' });
    }

    const conversations = await Conversation.find()
      .populate('userId', 'name email')
      .sort('-createdAt');

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 