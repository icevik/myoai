import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Avatar,
  Divider,
  Alert,
  IconButton,
  Card,
  CardContent,
  Chip,
  useTheme
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const Profile = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Şifre değişikliği kontrolü
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Yeni şifreler eşleşmiyor');
          setLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          setError('Şifre en az 6 karakter olmalıdır');
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Profil bilgilerini güncelle
      if (formData.name !== user.name) {
        await axios.put(`${API_URL}/users/${user._id}`, {
          name: formData.name
        }, { headers });
      }

      // Şifre değişikliği
      if (formData.currentPassword && formData.newPassword) {
        await axios.put(`${API_URL}/auth/change-password`, {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }, { headers });
      }

      setSuccess('Profil başarıyla güncellendi');
      setEditing(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Güncelleme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Card elevation={0}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2.5rem',
                  mr: 3
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {user?.name}
                </Typography>
                <Chip
                  icon={<SchoolIcon />}
                  label={user?.role === 'admin' ? 'Admin' : 'Öğrenci'}
                  color={user?.role === 'admin' ? 'secondary' : 'primary'}
                  variant="outlined"
                />
              </Box>
              {!editing && (
                <IconButton
                  sx={{ ml: 'auto' }}
                  onClick={() => setEditing(true)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              )}
            </Box>

            {(error || success) && (
              <Box sx={{ mb: 3 }}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {user?.email}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ad Soyad"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                {editing && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }}>
                        <Chip label="Şifre Değiştir" />
                      </Divider>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Mevcut Şifre"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Yeni Şifre"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        helperText="En az 6 karakter"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Yeni Şifre (Tekrar)"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </Grid>
                  </>
                )}

                {editing && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditing(false);
                          setError('');
                          setSuccess('');
                          setFormData({
                            name: user?.name || '',
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={<SaveIcon />}
                      >
                        Kaydet
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Profile; 