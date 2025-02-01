import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Box,
  styled
} from '@mui/material';
import {
  Send as SendIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://34.136.154.58:5000';

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh'
}));

const Sidebar = styled(Paper)(({ theme }) => ({
  width: 240,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column'
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)'
}));

const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2)
}));

const MessageBubble = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  maxWidth: '70%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[200],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary
}));

const Dashboard = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState(['INP', 'MEC', 'AUT', 'ELT']);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadMessages();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Dersler yüklenirken hata:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/history/${selectedCourse.code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.flatMap(conv => conv.messages));
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
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

      setMessages([
        ...messages,
        { role: 'user', content: newMessage },
        { role: 'bot', content: response.data }
      ]);
      setNewMessage('');
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <Root>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Öğrenci Paneli
          </Typography>
          <IconButton color="inherit" onClick={() => history.push('/profile')}>
            <PersonIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Boşluk için */}
      
      <Sidebar elevation={3}>
        <Typography variant="h6" gutterBottom>
          Kategoriler
        </Typography>
        <List>
          {categories.map((category) => (
            <React.Fragment key={category}>
              <ListItem button>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText primary={category} />
              </ListItem>
              <List component="div" disablePadding>
                {courses
                  .filter(course => course.category === category)
                  .map(course => (
                    <ListItem
                      button
                      key={course.code}
                      selected={selectedCourse?.code === course.code}
                      onClick={() => setSelectedCourse(course)}
                      sx={{ pl: 4 }}
                    >
                      <ListItemText primary={course.code} />
                    </ListItem>
                  ))}
              </List>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Sidebar>

      <ChatContainer elevation={3}>
        {selectedCourse ? (
          <>
            <Typography variant="h6" gutterBottom>
              {selectedCourse.code} Dersi Chatbot
            </Typography>
            <MessageList>
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  isUser={message.role === 'user'}
                  elevation={1}
                >
                  <Typography>{message.content}</Typography>
                </MessageBubble>
              ))}
            </MessageList>
            <form onSubmit={handleSendMessage}>
              <Grid container spacing={2}>
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
                  <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={loading}
                  >
                    Gönder
                  </Button>
                </Grid>
              </Grid>
            </form>
          </>
        ) : (
          <Typography variant="h6" align="center">
            Sohbet başlatmak için bir ders seçin
          </Typography>
        )}
      </ChatContainer>
    </Root>
  );
};

export default Dashboard; 