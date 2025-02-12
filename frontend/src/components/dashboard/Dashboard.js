import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  CircularProgress,
  Chip,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Badge,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  CardActions,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Send as SendIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  NoteAdd as NoteIcon,
  Code as CodeIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Category as CategoryIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useQuery, useQueryClient } from 'react-query';
import ConversationHistory from './ConversationHistory';

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column'
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
}));

const MessageList = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const MessageBubble = styled(motion.div)(({ theme, isUser }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  '& pre': {
    margin: 0,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    overflow: 'auto'
  }
}));

const CourseCard = styled(motion.div)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
  }
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`
}));

const CourseDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320,
    padding: theme.spacing(2)
  }
}));

const SearchBox = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const CourseDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '100%',
    maxWidth: 800,
    height: '80vh',
    maxHeight: 800
  }
}));

const DocumentList = styled(List)(({ theme }) => ({
  maxHeight: 400,
  overflow: 'auto'
}));

const Dashboard = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const messageListRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [conversations, setConversations] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // React Query hooks
  const { data: coursesData, isLoading: coursesLoading } = useQuery('courses', async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery('categories', async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  });

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      const scrollHeight = messageListRef.current.scrollHeight;
      messageListRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const filteredCourses = coursesData?.filter(course => {
    const matchesSearch = searchTerm ? (
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;

    const matchesCategory = selectedCategory === 'all' 
      ? true 
      : selectedCategory === 'favorites'
      ? favorites.includes(course._id)
      : course.category?._id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
      queryClient.invalidateQueries(['courses', selectedCategory]);
    }
  }, [selectedCategory]);

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setMessages([]);
    setError('');
    
    // Yeni konuşma başlat
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chat/conversations/new`,
        { courseId: course._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentSessionId(response.data.conversationId);
    } catch (error) {
      console.error('Yeni konuşma başlatılırken hata:', error);
      setError('Yeni konuşma başlatılamadı');
      return;
    }
    
    if (course.welcomeMessage) {
      setMessages([{
        role: 'assistant',
        content: course.welcomeMessage,
        timestamp: new Date()
      }]);
    }
    
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const resetConversation = async () => {
    if (!selectedCourse) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chat/conversations/new`,
        { courseId: selectedCourse._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCurrentSessionId(response.data.conversationId);
      setMessages([]);
      
      if (selectedCourse.welcomeMessage) {
        setMessages([{
          role: 'assistant',
          content: selectedCourse.welcomeMessage,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Konuşma sıfırlanırken hata:', error);
      setError('Konuşma sıfırlanamadı');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCourse) return;

    try {
      setLoading(true);
      setError('');

      // Kullanıcı mesajını hemen göster
      const userMessage = {
        role: 'user',
        content: newMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      console.log('Mesaj gönderiliyor:', {
        courseCode: selectedCourse.code,
        messageLength: newMessage.length
      });

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chat/${selectedCourse.code}`,
        { message: newMessage },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 saniye timeout
        }
      );

      console.log('API yanıtı:', {
        status: response.status,
        hasMessage: !!response.data?.message,
        messageLength: response.data?.message?.length
      });

      if (response.data?.message) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('API yanıtı boş');
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Hata mesajını göster
      setError(
        error.response?.data?.message ||
        error.message ||
        'Mesaj gönderilirken bir hata oluştu'
      );

      // Timeout hatası
      if (error.code === 'ECONNABORTED') {
        setError('Sunucu yanıt vermedi, lütfen tekrar deneyin');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (courseId) => {
    const newFavorites = favorites.includes(courseId)
      ? favorites.filter(id => id !== courseId)
      : [...favorites, courseId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const renderCourseGrid = () => {
    if (coursesLoading) {
      return Array(6).fill(0).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
      ));
    }

    return filteredCourses?.map(course => (
      <Grid item xs={12} sm={6} md={4} key={course._id}>
        <CourseCard
          as={Card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => handleCourseSelect(course)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {course.name}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(course._id);
                }}
              >
                {favorites.includes(course._id) ? (
                  <StarIcon color="warning" />
                ) : (
                  <StarBorderIcon />
                )}
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {course.code}
            </Typography>
            <Chip
              icon={<CategoryIcon />}
              label={categoriesData?.find(cat => cat._id === course.category)?.name || 'Kategori'}
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
          <CardActions>
            <Button
              size="small"
              startIcon={<ChatIcon />}
              onClick={() => handleCourseSelect(course)}
            >
              Sohbete Başla
            </Button>
          </CardActions>
        </CourseCard>
      </Grid>
    ));
  };

  // Konuşma geçmişini yükle
  const loadConversations = async (courseId) => {
    try {
      setConversationsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations${courseId ? `?courseId=${courseId}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Konuşma geçmişi yüklenirken hata:', error);
      setError('Konuşma geçmişi yüklenemedi');
    } finally {
      setConversationsLoading(false);
    }
  };

  // Konuşma detayını yükle
  const loadConversationDetail = async (conversationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(response.data.messages);
      setSelectedConversation(response.data);
    } catch (error) {
      console.error('Konuşma detayı yüklenirken hata:', error);
      setError('Konuşma detayı yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseRequest = async (courseData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/courses/request`, courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries('courses');
      setCourseDialogOpen(false);
    } catch (error) {
      console.error('Ders talebi oluşturulurken hata:', error);
      setError('Ders talebi oluşturulamadı');
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleFileUpload = async () => {
    if (!selectedCourse || selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/courses/${selectedCourse.code}/documents`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      setSelectedFiles([]);
      setUploadProgress(0);
      queryClient.invalidateQueries(['courses', selectedCourse.code]);
    } catch (error) {
      console.error('Doküman yüklenirken hata:', error);
      setError('Doküman yüklenemedi');
    }
  };

  const handleFileDelete = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/courses/${selectedCourse.code}/documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      queryClient.invalidateQueries(['courses', selectedCourse.code]);
    } catch (error) {
      console.error('Doküman silinirken hata:', error);
      setError('Doküman silinemedi');
    }
  };

  const handleApiConfigUpdate = async (apiConfig) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/courses/${selectedCourse.code}/api-config`,
        apiConfig,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      queryClient.invalidateQueries(['courses', selectedCourse.code]);
    } catch (error) {
      console.error('API yapılandırması güncellenirken hata:', error);
      setError('API yapılandırması güncellenemedi');
    }
  };

  const renderCourseDialog = () => (
    <CourseDialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)}>
      <DialogTitle>Yeni Ders Talebi</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ders Kodu"
              name="code"
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ders Adı"
              name="name"
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Açıklama"
              name="description"
              multiline
              rows={4}
              margin="normal"
            />
          </Grid>
          {/* Kategori seçimi */}
          {/* ... */}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCourseDialogOpen(false)}>İptal</Button>
        <Button variant="contained" color="primary" onClick={handleCourseRequest}>
          Talep Oluştur
        </Button>
      </DialogActions>
    </CourseDialog>
  );

  const renderDocumentSection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Dokümanlar
      </Typography>
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileSelect}
      />
      <Button
        variant="contained"
        startIcon={<NoteIcon />}
        onClick={() => fileInputRef.current?.click()}
        sx={{ mb: 2 }}
      >
        Doküman Seç
      </Button>
      {selectedFiles.length > 0 && (
        <>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemText primary={file.name} />
                <IconButton onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}>
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFileUpload}
            disabled={uploadProgress > 0}
          >
            {uploadProgress > 0 ? `Yükleniyor... ${uploadProgress}%` : 'Yükle'}
          </Button>
        </>
      )}
      {selectedCourse?.documents && (
        <DocumentList>
          {selectedCourse.documents.map((doc) => (
            <ListItem key={doc._id}>
              <ListItemText
                primary={doc.title}
                secondary={format(new Date(doc.uploadedAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
              />
              <IconButton onClick={() => handleFileDelete(doc._id)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </DocumentList>
      )}
    </Box>
  );

  const renderApiConfigSection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        API Yapılandırması
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="API Host"
            value={selectedCourse?.apiConfig?.host || ''}
            onChange={(e) => handleApiConfigUpdate({ ...selectedCourse?.apiConfig, host: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Chatbot ID"
            value={selectedCourse?.apiConfig?.chatbotId || ''}
            onChange={(e) => handleApiConfigUpdate({ ...selectedCourse?.apiConfig, chatbotId: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Security Key"
            type="password"
            value={selectedCourse?.apiConfig?.securityKey || ''}
            onChange={(e) => handleApiConfigUpdate({ ...selectedCourse?.apiConfig, securityKey: e.target.value })}
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <StyledContainer maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dersler" value="courses" />
          <Tab label="Konuşma Geçmişi" value="history" />
        </Tabs>
      </Box>

      {activeTab === 'courses' ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ders ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedCategory === 'favorites'}
                    onChange={(e) => setSelectedCategory(e.target.checked ? 'favorites' : 'all')}
                  />
                }
                label="Favoriler"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                label="Tümü"
                onClick={() => setSelectedCategory('all')}
                color={selectedCategory === 'all' ? 'primary' : 'default'}
                variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              />
              {categoriesData?.map(category => (
                <Chip
                  key={category._id}
                  label={category.name}
                  onClick={() => setSelectedCategory(category._id)}
                  color={selectedCategory === category._id ? 'primary' : 'default'}
                  variant={selectedCategory === category._id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          <AnimatePresence>
            {renderCourseGrid()}
          </AnimatePresence>
        </Grid>
      ) : (
        <ConversationHistory />
      )}

      <Dialog
        open={!!selectedCourse}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        onClose={() => {
          setSelectedCourse(null);
          setCurrentSessionId(null);
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedCourse?.name} ({selectedCourse?.code})
            </Typography>
            <Box>
              <Tooltip title="Konuşmayı Sıfırla">
                <IconButton onClick={resetConversation} sx={{ mr: 1 }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => {
                setSelectedCourse(null);
                setCurrentSessionId(null);
              }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent 
          dividers 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '70vh'
          }}
        >
          <ChatContainer>
            <MessageList 
              ref={messageListRef}
              sx={{
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.divider,
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: theme.palette.action.hover,
                },
              }}
            >
              <AnimatePresence>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    isUser={message.role === 'user'}
                    initial={{ opacity: 0, scale: 0.8, x: message.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ReactMarkdown
                      components={{
                        code: ({ node, inline, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                      {format(new Date(message.timestamp), 'HH:mm', { locale: tr })}
                    </Typography>
                  </MessageBubble>
                ))}
              </AnimatePresence>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </MessageList>
            <InputContainer>
              <form onSubmit={handleSendMessage}>
                <Grid container spacing={1}>
                  <Grid item xs>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item>
                    <IconButton
                      color="primary"
                      type="submit"
                      disabled={loading || !newMessage.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </form>
            </InputContainer>
          </ChatContainer>
        </DialogContent>
      </Dialog>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<NoteIcon />}
              onClick={() => setCourseDialogOpen(true)}
            >
              Ders Talebi Oluştur
            </Button>
          </Box>
        </Grid>
        {renderCourseDialog()}
        {renderDocumentSection()}
        {renderApiConfigSection()}
      </Grid>
    </StyledContainer>
  );
};

export default Dashboard; 