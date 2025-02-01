import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  styled
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Root = styled('div')(({ theme }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  marginBottom: theme.spacing(4)
}));

const Title = styled(Typography)(({ theme }) => ({
  flexGrow: 1
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4)
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4)
}));

const Form = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2)
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2)
}));

const Section = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(4)
}));

const Profile = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlert({
        open: true,
        message: 'Yeni şifreler eşleşmiyor',
        severity: 'error'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://34.28.93.220:5000/api/auth/change-password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setAlert({
        open: true,
        message: 'Şifreniz başarıyla güncellendi',
        severity: 'success'
      });
    } catch (error) {
      setAlert({
        open: true,
        message: error.response?.data?.message || 'Şifre güncellenirken hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleLogout = () => {
    logout();
    history.push('/');
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Root>
      <StyledAppBar position="static">
        <Toolbar>
          <Title variant="h6">
            Profil
          </Title>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </StyledAppBar>

      <StyledContainer>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Section>
                <Typography variant="h6" gutterBottom>
                  Profil Bilgileri
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ad Soyad"
                      value={user?.name || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="E-posta"
                      value={user?.email || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Rol"
                      value={user?.role === 'admin' ? 'Admin' : 'Öğrenci'}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Section>

              <Section>
                <Typography variant="h6" gutterBottom>
                  Şifre Değiştir
                </Typography>
                <Form onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="currentPassword"
                        label="Mevcut Şifre"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="newPassword"
                        label="Yeni Şifre"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="confirmPassword"
                        label="Yeni Şifre Tekrar"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Grid>
                  </Grid>
                  <SubmitButton
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                  >
                    Şifreyi Güncelle
                  </SubmitButton>
                </Form>
              </Section>
            </StyledPaper>
          </Grid>
        </Grid>
      </StyledContainer>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Root>
  );
};

export default Profile; 