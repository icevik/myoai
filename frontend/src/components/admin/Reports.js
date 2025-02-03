import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [courseUsage, setCourseUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsRes, userActivityRes, courseUsageRes] = await Promise.all([
        axios.get('/api/reports/stats', { headers }),
        axios.get('/api/reports/user-activity', { headers }),
        axios.get('/api/reports/course-usage', { headers })
      ]);
      setStats(statsRes.data);
      setUserActivity(userActivityRes.data);
      setCourseUsage(courseUsageRes.data);
      setError(null);
    } catch (err) {
      setError('Raporlar alınamadı');
      console.error('Raporlar alınırken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Genel İstatistikler" />
        <Tab label="Kullanıcı Aktiviteleri" />
        <Tab label="Ders Kullanımı" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kullanıcı İstatistikleri
                </Typography>
                <Typography>Toplam Kullanıcı: {stats.users.total}</Typography>
                <Typography>Onaylı Kullanıcı: {stats.users.approved}</Typography>
                <Typography>Onay Bekleyen: {stats.users.pending}</Typography>
                <Typography>Öğrenci Sayısı: {stats.users.students}</Typography>
                <Typography>Admin Sayısı: {stats.users.admins}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ders İstatistikleri
                </Typography>
                <Typography>Toplam Ders: {stats.courses.total}</Typography>
                {stats.courses.byCategory.map((cat) => (
                  <Typography key={cat._id}>
                    {cat._id}: {cat.count} ders
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Konuşma İstatistikleri
                </Typography>
                <Typography>Toplam Konuşma: {stats.conversations.total}</Typography>
                <Typography>Toplam Mesaj: {stats.conversations.messageCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell align="right">Mesaj Sayısı</TableCell>
                <TableCell align="right">Ders Sayısı</TableCell>
                <TableCell>Son Aktivite</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userActivity.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell align="right">{user.messageCount}</TableCell>
                  <TableCell align="right">{user.courseCount}</TableCell>
                  <TableCell>
                    {format(new Date(user.lastActivity), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ders Kodu</TableCell>
                <TableCell>Ders Adı</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell align="right">Kullanıcı Sayısı</TableCell>
                <TableCell align="right">Mesaj Sayısı</TableCell>
                <TableCell>Son Kullanım</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courseUsage.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>{course._id}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell align="right">{course.userCount}</TableCell>
                  <TableCell align="right">{course.messageCount}</TableCell>
                  <TableCell>
                    {format(new Date(course.lastUsed), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
    </Box>
  );
};

export default Reports; 