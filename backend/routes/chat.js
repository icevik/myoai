const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Course = require('../models/Course');
const Conversation = require('../models/Conversation');

// Yeni mesaj gönderme
router.post('/:courseCode', protect, async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { message } = req.body;
    
    // Dersi bul
    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    // API yapılandırmasını kontrol et
    if (!course.apiConfig || !course.apiConfig.host || !course.apiConfig.chatbotId || !course.apiConfig.securityKey) {
      return res.status(400).json({ message: 'Ders API yapılandırması eksik' });
    }

    // Konuşma kaydı oluştur veya mevcut olanı bul
    let conversation = await Conversation.findOne({
      user: req.user._id,
      course: course._id,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!conversation) {
      conversation = new Conversation({
        user: req.user._id,
        course: course._id,
        messages: []
      });
    }

    // API isteği için payload hazırla
    const payload = {
      question: message,
      overrideConfig: {
        systemMessage: course.welcomeMessage || "Merhaba, size nasıl yardımcı olabilirim?",
        maxIterations: 1,
        sessionId: conversation._id.toString(),
        memoryKey: `${courseCode}_${req.user._id}`
      }
    };

    // Knowhy API'ye istek at
    const apiResponse = await axios.post(
      `${course.apiConfig.host}/api/v1/prediction/${course.apiConfig.chatbotId}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${course.apiConfig.securityKey}`
        }
      }
    );

    // Mesajları kaydet
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    if (apiResponse.data && apiResponse.data.response) {
      conversation.messages.push({
        role: 'assistant',
        content: apiResponse.data.response,
        timestamp: new Date()
      });
    }

    await conversation.save();

    res.json({
      message: apiResponse.data.response,
      conversationId: conversation._id
    });

  } catch (error) {
    console.error('Chat hatası:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Sunucu hatası',
      error: error.response?.data || error.message 
    });
  }
});

// Konuşma geçmişini getir
router.get('/conversations', protect, async (req, res) => {
  try {
    const { courseId, limit = 10, page = 1 } = req.query;
    const query = { user: req.user._id };
    
    if (courseId) {
      query.course = courseId;
    }

    const conversations = await Conversation.find(query)
      .populate('course', 'code name')
      .sort('-updatedAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Konuşma geçmişi alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşma detayını getir
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('course', 'code name welcomeMessage');
      
    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    if (conversation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu konuşmaya erişim yetkiniz yok' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Konuşma detayı alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşmayı sil
router.delete('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    if (conversation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu konuşmayı silme yetkiniz yok' });
    }

    await conversation.remove();
    res.json({ message: 'Konuşma başarıyla silindi' });
  } catch (error) {
    console.error('Konuşma silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşmayı arşivle
router.put('/conversations/:id/archive', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    if (conversation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu konuşmayı arşivleme yetkiniz yok' });
    }

    conversation.isActive = false;
    await conversation.save();

    res.json({ message: 'Konuşma başarıyla arşivlendi' });
  } catch (error) {
    console.error('Konuşma arşivlenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 