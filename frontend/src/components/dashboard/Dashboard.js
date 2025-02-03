import React, { useState, useEffect, useRef } from 'react';
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
  Alert
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
  Save as SaveIcon
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

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const messageListRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [notes, setNotes] = useState({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    loadFavorites();
    loadNotes();
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [coursesRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setCourses(coursesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    }
  };

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const loadNotes = () => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setMessages([]);
    setError('');
    
    // Karşılama mesajını ekle
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

    // Konuşma geçmişini yükle
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations?courseId=${course._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversationHistory(response.data.conversations);
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

  const handleAddNote = (courseId, note) => {
    const newNotes = {
      ...notes,
      [courseId]: [...(notes[courseId] || []), note]
    };
    setNotes(newNotes);
    localStorage.setItem('notes', JSON.stringify(newNotes));
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    courses.some(course =>
      course.category === category._id &&
      (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       course.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const renderMessage = (message) => {
    return (
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
    );
  };

  return (
    <StyledContainer maxWidth="xl">
      {/* Mobil menü butonu */}
      {isMobile && (
        <Box sx={{ position: 'fixed', left: 16, top: 80, zIndex: 1200 }}>
          <Fab color="primary" size="small" onClick={toggleDrawer}>
            {drawerOpen ? <CloseIcon /> : <MenuIcon />}
          </Fab>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dersler Drawer */}
      <CourseDrawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Derslerim
          </Typography>
          <Tooltip title="Konuşma Geçmişi">
            <IconButton onClick={() => setHistoryDialogOpen(true)}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <SearchBox
          fullWidth
          variant="outlined"
          placeholder="Ders veya kategori ara..."
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

        {filteredCategories.map((category) => (
          <Accordion key={category._id} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {category.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List disablePadding>
                {courses
                  .filter(course => course.category === category._id)
                  .map((course) => (
                    <ListItem
                      key={course._id}
                      button
                      selected={selectedCourse?._id === course._id}
                      onClick={() => handleCourseSelect(course)}
                      secondaryAction={
                        <IconButton
                          edge="end"
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
                      }
                    >
                      <ListItemText
                        primary={course.name}
                        secondary={course.code}
                      />
                    </ListItem>
                  ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </CourseDrawer>

      {/* Chat alanı */}
      <Grid item xs={12} sx={{ pl: drawerOpen && !isMobile ? '320px' : 0 }}>
        <ChatContainer>
          {selectedCourse ? (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                  {selectedCourse.name} ({selectedCourse.code})
                </Typography>
              </Box>

              <MessageList ref={messageListRef}>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    isUser={message.role === 'user'}
                  >
                    {renderMessage(message)}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {format(new Date(message.timestamp), 'PPpp', { locale: tr })}
                    </Typography>
                  </MessageBubble>
                ))}
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
                        multiline
                        maxRows={4}
                      />
                    </Grid>
                    <Grid item>
                      <IconButton
                        color="primary"
                        type="submit"
                        disabled={!newMessage.trim() || loading}
                      >
                        <SendIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </form>
              </InputContainer>
            </>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Sohbet başlatmak için bir ders seçin
              </Typography>
            </Box>
          )}
        </ChatContainer>
      </Grid>

      {/* Konuşma Geçmişi Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Konuşma Geçmişi
          <IconButton
            onClick={() => setHistoryDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {conversationHistory.map((conversation) => (
              <ListItem
                key={conversation._id}
                button
                onClick={() => {
                  setSelectedConversation(conversation);
                  setMessages(conversation.messages);
                  setHistoryDialogOpen(false);
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {conversation.course.name}
                      </Typography>
                      <Chip
                        label={conversation.course.code}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={format(new Date(conversation.updatedAt), 'PPpp', { locale: tr })}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </StyledContainer>
  );
};

export default Dashboard; 