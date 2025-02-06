import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  styled
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const StyledContainer = styled(Container)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 400,
  width: '100%'
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1)
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2)
}));

const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.main
}));

const Login = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.name === 'email' ? e.target.value.toLowerCase() : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Form validasyonu
      if (!formData.email || !formData.password) {
        setError('Email ve şifre zorunludur');
        return;
      }

      // Email format kontrolü
      if (!formData.email.match(/@(std\.)?yeditepe\.edu\.tr$/)) {
        setError('Geçerli bir Yeditepe email adresi giriniz');
        return;
      }

      // Şifre uzunluk kontrolü
      if (formData.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return;
      }

      console.log('Giriş denemesi:', { email: formData.email });
      await login(formData.email, formData.password);

      const user = JSON.parse(localStorage.getItem('user'));
      console.log('Giriş başarılı, yönlendiriliyor...', {
        role: user?.role,
        isApproved: user?.isApproved
      });

      if (user && user.role === 'admin') {
        history.push('/admin');
      } else {
        history.push('/dashboard');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError(typeof error === 'string' ? error : 'Giriş yapılırken bir hata oluştu. Lütfen kullanıcı adınızı ve şifrenizi kontrol ediniz.');
    }
  };

  return (
    <StyledContainer component="main" maxWidth="xs">
      <StyledPaper elevation={3}>
        <Typography component="h1" variant="h5">
          Giriş Yap
        </Typography>
        <StyledForm onSubmit={handleSubmit}>
          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posta Adresi"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Şifre"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          <StyledButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
          >
            Giriş Yap
          </StyledButton>
          <Typography align="center">
            Hesabınız yok mu?{' '}
            <StyledLink to="/register">
              Kayıt Ol
            </StyledLink>
          </Typography>
        </StyledForm>
      </StyledPaper>
    </StyledContainer>
  );
};

export default Login; 