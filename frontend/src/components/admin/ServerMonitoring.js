import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ServerMonitoring = () => {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServerStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/monitoring/status', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setServerStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Sunucu durumu alınamadı');
      console.error('Sunucu durumu alınırken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const memoryUsagePercent = serverStatus.memory && serverStatus.memory.total 
    ? ((serverStatus.memory.used / serverStatus.memory.total) * 100).toFixed(1)
    : 0;
  const uptimeInSeconds = serverStatus.system.uptime;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Sunucu Durumu
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Bilgileri
              </Typography>
              <Typography>Model: {serverStatus.cpu.model}</Typography>
              <Typography>Çekirdek Sayısı: {serverStatus.cpu.cores}</Typography>
              <Typography>Hız: {serverStatus.cpu.speed} MHz</Typography>
              <Typography>Yük Ortalaması: {serverStatus.cpu.loadAvg.join(', ')}</Typography>
              <Box mt={2}>
                <Typography gutterBottom>CPU Kullanımı:</Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(serverStatus.cpu.loadAvg[0] * 10, 100)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bellek Kullanımı
              </Typography>
              <Box mb={2}>
                <Typography gutterBottom>RAM:</Typography>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(memoryUsagePercent) || 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography>
                Kullanılan: {serverStatus.memory ? (serverStatus.memory.used / 1024 / 1024 / 1024).toFixed(2) : 0} GB
              </Typography>
              <Typography>
                Toplam: {serverStatus.memory ? (serverStatus.memory.total / 1024 / 1024 / 1024).toFixed(2) : 0} GB
              </Typography>
              <Typography>Kullanım Oranı: {memoryUsagePercent || 0}%</Typography>

              <Box mt={3}>
                <Typography gutterBottom>SWAP:</Typography>
                <LinearProgress
                  variant="determinate"
                  value={serverStatus.swap ? (serverStatus.swap.used / serverStatus.swap.total) * 100 : 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography>
                  Kullanılan: {serverStatus.swap ? `${serverStatus.swap.used} MB / ${serverStatus.swap.total} MB` : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Disk Kullanımı
              </Typography>
              <Box mb={2}>
                <LinearProgress
                  variant="determinate"
                  value={serverStatus.disk ? parseInt(serverStatus.disk.usagePercent) : 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography>Toplam: {serverStatus.disk ? serverStatus.disk.total : 'N/A'}</Typography>
              <Typography>Kullanılan: {serverStatus.disk ? serverStatus.disk.used : 'N/A'}</Typography>
              <Typography>Boş: {serverStatus.disk ? serverStatus.disk.free : 'N/A'}</Typography>
              <Typography>Kullanım: {serverStatus.disk ? serverStatus.disk.usagePercent : '0%'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Docker Konteynerleri
              </Typography>
              <List>
                {serverStatus.docker && serverStatus.docker.containers && serverStatus.docker.containers.map((container, index) => (
                  <React.Fragment key={container.name || index}>
                    <ListItem>
                      <ListItemText
                        primary={container.name}
                        secondary={container.status}
                      />
                      <Chip
                        label={container.status && container.status.includes('Up') ? 'Çalışıyor' : 'Durdu'}
                        color={container.status && container.status.includes('Up') ? 'success' : 'error'}
                        size="small"
                      />
                    </ListItem>
                    {index < serverStatus.docker.containers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sistem Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography>
                    Çalışma Süresi: {serverStatus.system ? formatDistanceToNow(Date.now() - (serverStatus.system.uptime * 1000), { locale: tr }) : 'N/A'}
                  </Typography>
                  <Typography>Platform: {serverStatus.system?.platform || 'N/A'}</Typography>
                  <Typography>Sürüm: {serverStatus.system?.release || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>Sunucu Adı: {serverStatus.system?.hostname || 'N/A'}</Typography>
                  <Typography>Mimari: {serverStatus.system?.arch || 'N/A'}</Typography>
                  <Typography>Sistem Tipi: {serverStatus.system?.type || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography>Process ID: {serverStatus.process?.pid || 'N/A'}</Typography>
                  <Typography>
                    Process Bellek: {serverStatus.process?.memory?.heapUsed 
                      ? (serverStatus.process.memory.heapUsed / (1024 * 1024)).toFixed(2)
                      : 'N/A'} MB
                  </Typography>
                  <Typography>
                    Bağlantı Sayısı: {serverStatus.network?.connections 
                      ? Object.keys(serverStatus.network.connections).length 
                      : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServerMonitoring; 