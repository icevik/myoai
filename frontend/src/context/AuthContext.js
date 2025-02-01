import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://34.28.93.220:5000';

// Axios instance oluştur
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 saniye
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Token yenileme kontrolü
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
      console.log('Token yenilendi');
    }
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Ağ hatası. Lütfen internet bağlantınızı kontrol edin.'));
    }

    // Token süresi dolmuşsa
    if (error.response.status === 401 && error.response.data?.expired) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=true';
      return Promise.reject(new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.'));
    }

    // Diğer 401 hataları
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      return Promise.reject(new Error(error.response.data?.message || 'Oturum hatası'));
    }

    return Promise.reject(error.response.data?.message || 'Bir hata oluştu');
  }
);

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const res = await axiosInstance.get('/api/auth/profile');
      setUser(res.data);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post('/api/auth/login', {
        email,
        password
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axiosInstance.post('/api/auth/register-request', {
        name,
        email,
        password
      });
      return res.data.message;
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 