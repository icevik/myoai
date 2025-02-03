import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const ServerMonitoring = () => {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServerStatus = async () => {
    try {
      const response = await axios.get('/api/courses/status');
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

  const memoryUsagePercent = ((serverStatus.memory.used / serverStatus.memory.total) * 100).toFixed(1);
  const uptimeInSeconds = serverStatus.uptime;

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
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(memoryUsagePercent)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography>
                Kullanılan: {(serverStatus.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB
              </Typography>
              <Typography>
                Toplam: {(serverStatus.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
              </Typography>
              <Typography>Kullanım Oranı: {memoryUsagePercent}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sistem Bilgileri
              </Typography>
              <Typography>
                Çalışma Süresi: {formatDistanceToNow(Date.now() - uptimeInSeconds * 1000, { locale: tr })}
              </Typography>
              <Typography>Platform: {serverStatus.platform}</Typography>
              <Typography>Sunucu Adı: {serverStatus.hostname}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServerMonitoring; 