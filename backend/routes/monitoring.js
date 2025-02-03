const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const os = require('os');
const { protect, admin } = require('../middleware/auth');

// Sistem kaynaklarını al
const getSystemResources = () => {
  return new Promise((resolve) => {
    exec('df -h / && free -b', (error, stdout) => {
      if (error) {
        console.error('Sistem kaynakları alınırken hata:', error);
        return resolve({
          disk: { total: '0', used: '0', available: '0', usagePercent: '0%' },
          swap: { total: 0, used: 0, free: 0 }
        });
      }

      try {
        console.log('Sistem kaynakları ham çıktısı:', stdout); // Debug log
        const lines = stdout.trim().split('\n');
        
        // Disk bilgisi
        const diskLine = lines.find(line => line.includes('/'));
        const diskInfo = diskLine ? diskLine.split(/\s+/).filter(Boolean) : [];
        console.log('Ayrıştırılan disk bilgisi:', diskInfo); // Debug log

        // Bellek bilgisi (byte cinsinden)
        const swapLine = lines.find(line => line.toLowerCase().includes('swap'));
        const swapInfo = swapLine ? swapLine.split(/\s+/).filter(Boolean) : [];
        console.log('Ayrıştırılan swap bilgisi:', swapInfo); // Debug log

        resolve({
          disk: {
            total: diskInfo[1] || '0',
            used: diskInfo[2] || '0',
            available: diskInfo[3] || '0',
            usagePercent: diskInfo[4]?.replace('%', '') || '0'
          },
          swap: {
            total: parseInt(swapInfo[1] || '0'),
            used: parseInt(swapInfo[2] || '0'),
            free: parseInt(swapInfo[3] || '0')
          }
        });
      } catch (err) {
        console.error('Sistem kaynakları parse edilirken hata:', err);
        resolve({
          disk: { total: '0', used: '0', available: '0', usagePercent: '0' },
          swap: { total: 0, used: 0, free: 0 }
        });
      }
    });
  });
};

// Docker container durumlarını al
const getDockerStatus = () => {
  return new Promise((resolve) => {
    exec('docker ps --format "{{.Names}},{{.Status}},{{.Image}}"', (error, stdout) => {
      if (error) {
        console.error('Docker durumu alınırken hata:', error);
        return resolve({ containers: [] });
      }
      try {
        console.log('Docker durumu ham çıktısı:', stdout); // Debug log
        const containers = stdout.trim().split('\n')
          .filter(line => line.length > 0)
          .map(line => {
            const [name, status, image] = line.split(',');
            return { name, status, image };
          });
        resolve({ containers });
      } catch (err) {
        console.error('Docker durumu parse edilirken hata:', err);
        resolve({ containers: [] });
      }
    });
  });
};

// Sunucu durumu endpoint'i
router.get('/status', protect, admin, async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Debug logları
    console.log('OS Bellek Değerleri:', {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory
    });

    const systemResources = await getSystemResources();
    const dockerStatus = await getDockerStatus();

    // Process bellek kullanımı
    const processMemory = process.memoryUsage();
    console.log('Process Bellek Kullanımı:', processMemory);

    const status = {
      cpu: {
        cores: cpus.length,
        model: cpus[0].model,
        speed: cpus[0].speed,
        loadAvg: os.loadavg()
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: Math.round((usedMemory / totalMemory) * 100)
      },
      system: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        uptime: Math.round(os.uptime()),
        hostname: os.hostname()
      },
      disk: systemResources.disk,
      swap: systemResources.swap,
      docker: dockerStatus,
      process: {
        pid: process.pid,
        memory: {
          heapUsed: processMemory.heapUsed,
          heapTotal: processMemory.heapTotal,
          rss: processMemory.rss,
          external: processMemory.external
        },
        uptime: process.uptime()
      },
      network: {
        connections: require('os').networkInterfaces()
      }
    };

    res.json(status);
  } catch (error) {
    console.error('Sunucu durumu alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu durumu alınamadı', error: error.message });
  }
});

module.exports = router; 