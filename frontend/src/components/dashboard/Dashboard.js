import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  styled
} from '@mui/material';
import { Send as SendIcon, Logout as LogoutIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100vh'
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth
  }
}));

const DrawerContainer = styled('div')({
  overflow: 'auto'
});

const Content = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3)
}));

const ChatContainer = styled('div')(({ theme }) => ({
  height: 'calc(100vh - 180px)',
  display: 'flex',
  flexDirection: 'column'
}));

const MessageList = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2)
}));

const MessageItem = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(1)
}));

const UserMessage = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: '#fff',
  borderRadius: '20px 20px 0 20px',
  padding: theme.spacing(1, 2)
}));

const BotMessage = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  borderRadius: '20px 20px 20px 0',
  padding: theme.spacing(1, 2)
}));

const InputContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#fff',
  borderTop: `1px solid ${theme.palette.divider}`
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginRight: theme.spacing(1)
}));

const Title = styled(Typography)(({ theme }) => ({
  flexGrow: 1
}));

const Dashboard = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
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
      const res = await axios.get('http://34.28.93.220:5000/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (error) {
      console.error('Dersler yüklenirken hata:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://34.28.93.220:5000/api/chat/history/${selectedCourse.code}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.length > 0) {
        setMessages(res.data[0].messages);
      } else {
        setMessages([]);
      }
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
      const res = await axios.post(
        `http://34.28.93.220:5000/api/chat/${selectedCourse.code}`,
        { message: newMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages([
        ...messages,
        { role: 'user', content: newMessage },
        { role: 'bot', content: res.data.message }
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
    history.push('/');
  };

  return (
    <Root>
      <StyledAppBar position="fixed">
        <Toolbar>
          <Title variant="h6">
            Chatbot Sistemi
          </Title>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </StyledAppBar>

      <StyledDrawer variant="permanent">
        <Toolbar />
        <DrawerContainer>
          <List>
            {courses.map((course) => (
              <ListItem
                button
                key={course.code}
                selected={selectedCourse?.code === course.code}
                onClick={() => setSelectedCourse(course)}
              >
                <ListItemText
                  primary={course.code}
                  secondary={course.category}
                />
              </ListItem>
            ))}
          </List>
        </DrawerContainer>
      </StyledDrawer>

      <Content>
        <Toolbar />
        {selectedCourse ? (
          <ChatContainer>
            <MessageList>
              {messages.map((message, index) => (
                <MessageItem
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent:
                      message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {message.role === 'user' ? (
                    <UserMessage>
                      <Typography>{message.content}</Typography>
                    </UserMessage>
                  ) : (
                    <BotMessage>
                      <Typography>{message.content}</Typography>
                    </BotMessage>
                  )}
                </MessageItem>
              ))}
            </MessageList>
            <InputContainer>
              <form onSubmit={handleSendMessage}>
                <Grid container spacing={2}>
                  <Grid item xs>
                    <StyledTextField
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
                      color="primary"
                      disabled={loading}
                      endIcon={<SendIcon />}
                    >
                      Gönder
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </InputContainer>
          </ChatContainer>
        ) : (
          <Typography variant="h6" align="center">
            Lütfen sohbet başlatmak için bir ders seçin
          </Typography>
        )}
      </Content>
    </Root>
  );
};

export default Dashboard; 