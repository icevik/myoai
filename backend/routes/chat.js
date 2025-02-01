const express = require('express');
const router = express.Router();
const axios = require('axios');
const Course = require('../models/Course');
const Conversation = require('../models/Conversation');
const { protect, admin } = require('../middleware/auth');

// Tüm konuşmaları getir (Admin only)
router.get('/conversations', protect, admin, async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('userId', 'name email')
      .sort('-createdAt');
    res.json(conversations);
  } catch (error) {
    console.error('Konuşmalar yüklenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının konuşmalarını getir
router.get('/my-conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.userId })
      .populate('courseCode', 'code category')
      .sort('-createdAt');
    res.json(conversations);
  } catch (error) {
    console.error('Konuşmalar yüklenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni mesaj gönder
router.post('/:courseCode', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const course = await Course.findOne({ code: req.params.courseCode });

    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    // Chatbot API'sine istek gönder
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
    const conversation = new Conversation({
      userId: req.user.userId,
      courseCode: course.code,
      messages: [
        { role: 'user', content: message },
        { role: 'bot', content: response.data }
      ]
    });

    await conversation.save();
    res.json(response.data);

  } catch (error) {
    console.error('Mesaj gönderilirken hata:', error);
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

module.exports = router; 