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
    
    // Kullanıcı istatistikleri
    const totalUsers = await User.countDocuments();
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const students = await User.countDocuments({ role: 'user' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Kurs istatistikleri
    const totalCourses = await Course.countDocuments();
    const byCategory = await Course.aggregate([
      {
        $group: {
          _id: { $toString: '$category' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Sohbet istatistikleri
    const totalConversations = await Conversation.countDocuments();
    const messageCount = await Conversation.aggregate([
      {
        $project: {
          messageCount: { $size: { $ifNull: ['$messages', []] } }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$messageCount' }
        }
      }
    ]).then(result => result[0]?.total || 0);

    const stats = {
      users: {
        total: totalUsers,
        approved: approvedUsers,
        pending: pendingUsers,
        students: students,
        admins: admins
      },
      courses: {
        total: totalCourses,
        byCategory: byCategory
      },
      conversations: {
        total: totalConversations,
        messageCount: messageCount
      }
    };

    console.log('İstatistikler:', stats);
    res.json(stats);
  } catch (error) {
    console.error('İstatistikler alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Kullanıcı aktiviteleri
router.get('/user-activity', protect, admin, async (req, res) => {
  try {
    console.log('Kullanıcı aktiviteleri raporu isteği alındı');
    const activities = await User.aggregate([
      {
        $lookup: {
          from: 'conversations',
          localField: '_id',
          foreignField: 'userId',
          as: 'conversations'
        }
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          name: 1,
          email: 1,
          role: 1,
          lastLogin: { 
            $cond: { 
              if: { $eq: ['$lastLogin', null] },
              then: null,
              else: '$lastLogin'
            }
          },
          messageCount: { $size: '$conversations' },
          lastActivity: {
            $cond: {
              if: { $gt: [{ $size: '$conversations' }, 0] },
              then: { $max: '$conversations.updatedAt' },
              else: null
            }
          }
        }
      },
      { $sort: { lastActivity: -1 } }
    ]);

    console.log('Kullanıcı aktiviteleri:', activities);
    res.json(activities);
  } catch (error) {
    console.error('Kullanıcı aktiviteleri alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Kurs kullanım istatistikleri
router.get('/course-usage', protect, admin, async (req, res) => {
  try {
    console.log('Kurs kullanım raporu isteği alındı');
    const usage = await Course.aggregate([
      {
        $lookup: {
          from: 'conversations',
          localField: 'code',
          foreignField: 'courseCode',
          as: 'conversations'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $project: {
          _id: 1,
          code: 1,
          name: 1,
          category: { $arrayElemAt: ['$categoryInfo', 0] },
          userCount: { $size: { $ifNull: ['$students', []] } },
          messageCount: {
            $reduce: {
              input: '$conversations',
              initialValue: 0,
              in: { $add: ['$$value', { $size: { $ifNull: ['$$this.messages', []] } }] }
            }
          },
          lastUsed: {
            $cond: {
              if: { $gt: [{ $size: '$conversations' }, 0] },
              then: { $max: '$conversations.updatedAt' },
              else: null
            }
          }
        }
      },
      { $sort: { lastUsed: -1 } }
    ]);

    console.log('Kurs kullanım istatistikleri:', usage);
    res.json(usage);
  } catch (error) {
    console.error('Kurs kullanım istatistikleri alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

module.exports = router; 