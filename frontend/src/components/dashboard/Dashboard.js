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
  Skeleton
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
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const filteredCourses = coursesData?.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setMessages([]);
    setError('');
    
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

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations?courseId=${course._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Konuşma geçmişini işle
    } catch (error) {
      console.error('Konuşma geçmişi yüklenirken hata:', error);
      setError('Konuşma geçmişi yüklenirken bir hata oluştu');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedCourse) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chat/${selectedCourse.code}`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [
        ...prev,
        { role: 'user', content: newMessage, timestamp: new Date() },
        { role: 'assistant', content: response.data.message, timestamp: new Date() }
      ]);
      setNewMessage('');
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      setError('Mesaj gönderilirken bir hata oluştu');
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

  return (
    <StyledContainer maxWidth="xl">
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

      <Dialog
        open={!!selectedCourse}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        onClose={() => setSelectedCourse(null)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {selectedCourse?.name} ({selectedCourse?.code})
            </Typography>
            <IconButton onClick={() => setSelectedCourse(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <ChatContainer>
            <MessageList ref={messageListRef}>
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
    </StyledContainer>
  );
};

export default Dashboard; 