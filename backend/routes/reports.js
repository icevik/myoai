const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Conversation = require('../models/Conversation');
const { protect, admin } = require('../middleware/auth');

// Genel istatistikleri getir
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        approved: await User.countDocuments({ isApproved: true }),
        pending: await User.countDocuments({ isApproved: false }),
        students: await User.countDocuments({ role: 'student' }),
        admins: await User.countDocuments({ role: 'admin' })
      },
      courses: {
        total: await Course.countDocuments(),
        byCategory: await Course.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ])
      },
      conversations: {
        total: await Conversation.countDocuments(),
        messageCount: await Conversation.aggregate([
          {
            $project: {
              messageCount: { $size: '$messages' }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$messageCount' }
            }
          }
        ]).then(result => result[0]?.total || 0)
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('İstatistikler alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı aktivite raporu
router.get('/user-activity', protect, admin, async (req, res) => {
  try {
    const activities = await Conversation.aggregate([
      {
        $group: {
          _id: '$userId',
          messageCount: { $sum: { $size: '$messages' } },
          lastActivity: { $max: '$lastMessageAt' },
          courseCount: { $addToSet: '$courseCode' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          messageCount: 1,
          lastActivity: 1,
          courseCount: { $size: '$courseCount' }
        }
      },
      {
        $sort: { lastActivity: -1 }
      }
    ]);

    res.json(activities);
  } catch (error) {
    console.error('Kullanıcı aktiviteleri alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ders kullanım raporu
router.get('/course-usage', protect, admin, async (req, res) => {
  try {
    const usage = await Conversation.aggregate([
      {
        $group: {
          _id: '$courseCode',
          userCount: { $addToSet: '$userId' },
          messageCount: { $sum: { $size: '$messages' } },
          lastUsed: { $max: '$lastMessageAt' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'code',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $project: {
          _id: 1,
          name: '$course.name',
          category: '$course.category',
          userCount: { $size: '$userCount' },
          messageCount: 1,
          lastUsed: 1
        }
      },
      {
        $sort: { messageCount: -1 }
      }
    ]);

    res.json(usage);
  } catch (error) {
    console.error('Ders kullanım raporu alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 