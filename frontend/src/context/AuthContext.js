import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// API URL'ini sunucu IP'sine göre ayarla
const API_URL = '/api';

// Axios instance oluştur
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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
    console.log('Request Config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Ağ hatası. Lütfen internet bağlantınızı kontrol edin.'));
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      if (error.response.data?.expired) {
        window.location.href = '/login?expired=true';
      }
      return Promise.reject(error.response.data?.message || 'Oturum hatası');
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
      const res = await axiosInstance.get('/auth/profile');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login isteği hazırlanıyor:', { email });
      
      // Email formatını kontrol et
      if (!email.match(/@(std\.)?yeditepe\.edu\.tr$/)) {
        throw new Error('Geçerli bir Yeditepe email adresi giriniz');
      }

      // Şifre uzunluğunu kontrol et
      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      console.log('Login isteği gönderiliyor...');
      const res = await axiosInstance.post('/auth/login', {
        email: email.toLowerCase(),
        password
      });

      console.log('Login cevabı alındı:', {
        status: res.status,
        hasToken: !!res.data.token,
        hasUser: !!res.data.user
      });

      if (!res.data.token || !res.data.user) {
        console.error('Geçersiz sunucu yanıtı:', res.data);
        throw new Error('Geçersiz sunucu yanıtı');
      }

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      console.log('Login başarılı, kullanıcı:', {
        id: user.id,
        email: user.email,
        role: user.role
      });

      return true;
    } catch (error) {
      console.error('Login hatası:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.data?.message) {
        throw error.response.data.message;
      } else if (error.message) {
        throw error.message;
      } else {
        throw 'Giriş yapılırken bir hata oluştu';
      }
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axiosInstance.post('/auth/register-request', {
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
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    axiosInstance
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { axiosInstance }; 