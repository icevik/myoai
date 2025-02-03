const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Course = require('../models/Course');
const { protect, admin } = require('../middleware/auth');

// Genel istatistikler
router.get('/stats', protect, admin, async (req, res) => {
  try {
    console.log('İstatistik raporu isteği alındı');
    const [
      totalUsers,
      totalChats,
      totalCourses,
      totalMessages
    ] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Course.countDocuments(),
      Conversation.aggregate([
        { $unwind: '$messages' },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]).then(result => result[0]?.count || 0)
    ]);

    const stats = {
      users: totalUsers,
      chats: totalChats,
      courses: totalCourses,
      messages: totalMessages
    };

    console.log('İstatistikler:', stats);
    res.json(stats);
  } catch (error) {
    console.error('İstatistikler alınırken hata:', error);
    res.status(500).json({ message: 'İstatistikler alınamadı', error: error.message });
  }
});

// Kullanıcı aktiviteleri
router.get('/user-activity', protect, admin, async (req, res) => {
  try {
    console.log('Kullanıcı aktiviteleri raporu isteği alındı');
    const activities = await Conversation.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$userId',
          userName: { $first: { $ifNull: ['$user.name', 'Bilinmeyen Kullanıcı'] } },
          userEmail: { $first: { $ifNull: ['$user.email', 'bilinmeyen@email.com'] } },
          totalChats: { $sum: 1 },
          totalMessages: { $sum: { $size: { $ifNull: ['$messages', []] } } },
          lastActivity: { $max: '$updatedAt' }
        }
      },
      { $sort: { totalMessages: -1 } }
    ]);

    console.log('Kullanıcı aktiviteleri:', activities);
    res.json(activities);
  } catch (error) {
    console.error('Kullanıcı aktiviteleri alınırken hata:', error);
    res.status(500).json({ message: 'Kullanıcı aktiviteleri alınamadı', error: error.message });
  }
});

// Kurs kullanım istatistikleri
router.get('/course-usage', protect, admin, async (req, res) => {
  try {
    console.log('Kurs kullanım raporu isteği alındı');
    const courseUsage = await Conversation.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$courseId',
          courseName: { $first: { $ifNull: ['$course.name', 'Bilinmeyen Kurs'] } },
          totalChats: { $sum: 1 },
          totalMessages: { $sum: { $size: { $ifNull: ['$messages', []] } } },
          uniqueUsers: { $addToSet: '$userId' },
          lastUsed: { $max: '$updatedAt' }
        }
      },
      {
        $project: {
          _id: 1,
          courseName: 1,
          totalChats: 1,
          totalMessages: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          lastUsed: 1
        }
      },
      { $sort: { totalMessages: -1 } }
    ]);

    console.log('Kurs kullanım istatistikleri:', courseUsage);
    res.json(courseUsage);
  } catch (error) {
    console.error('Kurs kullanım istatistikleri alınırken hata:', error);
    res.status(500).json({ message: 'Kurs kullanım istatistikleri alınamadı', error: error.message });
  }
});

module.exports = router; 