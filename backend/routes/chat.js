const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Course = require('../models/Course');
const Conversation = require('../models/Conversation');

// Yeni mesaj gönderme
router.post('/:courseCode', protect, async (req, res) => {
  try {
    console.log('Yeni mesaj isteği alındı:', {
      courseCode: req.params.courseCode,
      userId: req.user._id,
      messageLength: req.body.message?.length
    });

    const { courseCode } = req.params;
    const { message } = req.body;
    
    if (!message?.trim()) {
      console.log('Boş mesaj gönderildi');
      return res.status(400).json({ message: 'Mesaj boş olamaz' });
    }

    // Dersi bul
    const course = await Course.findOne({ code: courseCode });
    if (!course) {
      console.log('Ders bulunamadı:', courseCode);
      return res.status(404).json({ message: 'Ders bulunamadı' });
    }

    // Erişim kontrolü
    if (!course.hasAccess(req.user._id) && req.user.role !== 'admin') {
      console.log('Erişim reddedildi:', {
        userId: req.user._id,
        courseId: course._id,
        isPublic: course.isPublic,
        allowedUsers: course.allowedUsers
      });
      return res.status(403).json({ message: 'Bu derse erişim izniniz yok' });
    }

    console.log('Ders bulundu:', {
      courseId: course._id,
      courseName: course.name,
      hasApiConfig: !!course.apiConfig,
      isPublic: course.isPublic,
      hasAccess: course.hasAccess(req.user._id)
    });

    // API yapılandırmasını kontrol et
    if (!course.isApiConfigComplete()) {
      console.log('API yapılandırması eksik:', course.apiConfig);
      return res.status(400).json({ message: 'Ders API yapılandırması eksik' });
    }

    // Konuşma kaydı oluştur veya mevcut olanı bul
    let conversation = await Conversation.findOne({
      user: req.user._id,
      course: course._id,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!conversation) {
      console.log('Yeni konuşma oluşturuluyor');
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
        maxIterations: 10,
        sessionId: conversation._id.toString(),
        memoryKey: `${course.code}_${req.user._id}`
      }
    };

    console.log('API isteği gönderiliyor:', {
      url: `${course.apiConfig.host}/api/v1/prediction/${course.apiConfig.chatbotId}`,
      payloadLength: JSON.stringify(payload).length,
      sessionId: payload.overrideConfig.sessionId
    });

    // Knowhy API'ye istek at
    const apiResponse = await axios.post(
      `${course.apiConfig.host}/api/v1/prediction/${course.apiConfig.chatbotId}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${course.apiConfig.securityKey}`
        },
        timeout: 30000 // 30 saniye timeout
      }
    );

    console.log('API yanıtı alındı:', {
      status: apiResponse.status,
      hasText: !!apiResponse.data?.text,
      textLength: apiResponse.data?.text?.length
    });

    // Mesajları kaydet
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    if (apiResponse.data && apiResponse.data.text) {
      conversation.messages.push({
        role: 'assistant',
        content: apiResponse.data.text,
        timestamp: new Date()
      });
    }

    await conversation.save();
    console.log('Konuşma kaydedildi:', {
      conversationId: conversation._id,
      messageCount: conversation.messages.length
    });

    res.json({
      message: apiResponse.data.text,
      conversationId: conversation._id
    });

  } catch (error) {
    console.error('Chat hatası:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    // API hatası detaylarını kontrol et
    if (error.response) {
      return res.status(error.response.status).json({
        message: 'API hatası',
        error: error.response.data
      });
    }

    // Timeout hatası
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        message: 'API yanıt vermedi, lütfen tekrar deneyin'
      });
    }

    // Diğer hatalar
    res.status(500).json({ 
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Konuşma geçmişini getir
router.get('/conversations', protect, async (req, res) => {
  try {
    const { courseId, userId } = req.query;
    let query = {};
    
    // Admin tüm konuşmaları görebilir, normal kullanıcı sadece kendininkileri
    if (req.user.role === 'admin') {
      if (userId) {
        query.user = userId;
      }
    } else {
      query.user = req.user._id;
    }
    
    if (courseId) {
      query.course = courseId;
    }

    const conversations = await Conversation.find(query)
      .populate('course', 'code name')
      .populate('user', 'name email')
      .sort('-updatedAt')
      .lean();

    // Konuşmaları tarihe göre grupla
    const groupedConversations = conversations.reduce((groups, conv) => {
      const date = new Date(conv.updatedAt).toLocaleDateString('tr-TR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push({
        ...conv,
        lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
        messageCount: conv.messages.length
      });
      return groups;
    }, {});

    // Tarihleri sırala
    const sortedGroups = Object.entries(groupedConversations)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    res.json({
      conversations: sortedGroups,
      total: conversations.length
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
      .populate('course', 'code name welcomeMessage')
      .lean(); // JSON dönüşümü için lean() kullanıyoruz
      
    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    if (conversation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu konuşmaya erişim yetkiniz yok' });
    }

    // Mesajları tarihe göre sırala
    conversation.messages = conversation.messages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

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

// Yeni konuşma başlat
router.post('/conversations/new', protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Aktif konuşmayı kapat
    await Conversation.updateMany(
      { user: req.user._id, course: courseId, isActive: true },
      { isActive: false }
    );
    
    // Yeni konuşma oluştur
    const conversation = new Conversation({
      user: req.user._id,
      course: courseId,
      messages: []
    });
    
    await conversation.save();
    
    res.json({
      conversationId: conversation._id,
      message: 'Yeni konuşma başlatıldı'
    });
  } catch (error) {
    console.error('Yeni konuşma oluşturulurken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 