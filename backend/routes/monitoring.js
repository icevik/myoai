const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const os = require('os');

// Sistem kaynaklarını al
const getSystemResources = () => {
  return new Promise((resolve, reject) => {
    exec('df -h / && free -m', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      const lines = stdout.split('\n');
      const diskInfo = lines[1].split(/\s+/);
      const memInfo = lines[lines.length - 2].split(/\s+/);

      resolve({
        disk: {
          total: diskInfo[1],
          used: diskInfo[2],
          available: diskInfo[3],
          usagePercent: diskInfo[4]
        },
        swap: {
          total: parseInt(memInfo[1]),
          used: parseInt(memInfo[2]),
          free: parseInt(memInfo[3])
        }
      });
    });
  });
};

// Docker container durumlarını al
const getDockerStatus = () => {
  return new Promise((resolve, reject) => {
    exec('docker ps --format "{{.Names}}: {{.Status}}"', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      const containers = stdout.trim().split('\n').map(line => {
        const [name, status] = line.split(': ');
        return { name, status };
      });
      resolve(containers);
    });
  });
};

// Sunucu durumu endpoint'i
router.get('/status', async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const systemResources = await getSystemResources();
    const dockerStatus = await getDockerStatus();

    const status = {
      cpu: {
        cores: cpus.length,
        model: cpus[0].model,
        speed: cpus[0].speed,
        loadAvg: os.loadavg()
      },
      memory: {
        total: Math.round(totalMemory / 1024 / 1024),
        used: Math.round(usedMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        usagePercent: Math.round((usedMemory / totalMemory) * 100)
      },
      system: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
        hostname: os.hostname()
      },
      network: {
        interfaces: Object.entries(os.networkInterfaces()).reduce((acc, [name, info]) => {
          acc[name] = info.map(({ address, netmask, family, internal }) => ({
            address,
            netmask,
            family,
            internal
          }));
          return acc;
        }, {})
      },
      disk: systemResources.disk,
      swap: systemResources.swap,
      docker: dockerStatus,
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    res.json(status);
  } catch (error) {
    console.error('Sunucu durumu alınırken hata:', error);
    res.status(500).json({ message: 'Sunucu durumu alınamadı', error: error.message });
  }
});

module.exports = router; 