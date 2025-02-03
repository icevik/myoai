const express = require('express');
const router = express.Router();
const os = require('os');
const { protect, admin } = require('../middleware/auth');

// Sunucu durumunu getir
router.get('/status', protect, admin, async (req, res) => {
  try {
    const status = {
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        speed: os.cpus()[0].speed,
        loadAvg: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
      network: os.networkInterfaces()
    };

    res.json(status);
  } catch (error) {
    console.error('Sunucu durumu alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 