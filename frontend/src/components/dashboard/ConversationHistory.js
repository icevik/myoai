import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  TextField,
  InputAdornment,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const ConversationHistory = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Konuşma geçmişi yüklenirken hata:', error);
      setError('Konuşma geçmişi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleConversationClick = async (conversationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedConversation(response.data);
      setDialogOpen(true);
    } catch (error) {
      console.error('Konuşma detayı yüklenirken hata:', error);
      setError('Konuşma detayı yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/chat/conversations/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadConversations();
    } catch (error) {
      console.error('Konuşma silinirken hata:', error);
      setError('Konuşma silinemedi');
    }
  };

  const filteredConversations = Object.entries(conversations).reduce((acc, [date, convs]) => {
    const filtered = convs.filter(conv => {
      const courseName = conv.course?.name?.toLowerCase() || '';
      const courseCode = conv.course?.code?.toLowerCase() || '';
      const userEmail = conv.user?.email?.toLowerCase() || '';
      
      return courseName.includes(searchTerm.toLowerCase()) ||
             courseCode.includes(searchTerm.toLowerCase()) ||
             (user.role === 'admin' && userEmail.includes(searchTerm.toLowerCase()));
    });
    
    if (filtered.length > 0) {
      acc[date] = filtered;
    }
    return acc;
  }, {});

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Konuşma ara..."
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
          </Grid>
          <Grid item>
            <Tooltip title="Yenile">
              <IconButton onClick={loadConversations} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {Object.entries(filteredConversations).map(([date, convs]) => (
            <Grid item xs={12} key={date}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                {date}
              </Typography>
              <Grid container spacing={2}>
                {convs.map((conv) => (
                  <Grid item xs={12} md={6} lg={4} key={conv._id}>
                    <Card 
                      elevation={0} 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                      onClick={() => handleConversationClick(conv._id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {conv.course?.name || 'Silinmiş Ders'}
                          </Typography>
                        </Box>
                        
                        <Chip 
                          size="small" 
                          label={conv.course?.code || 'N/A'}
                          sx={{ mb: 2 }}
                        />

                        {user.role === 'admin' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <PersonIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {conv.user?.email || 'Silinmiş Kullanıcı'}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <TimeIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(conv.updatedAt), 'HH:mm', { locale: tr })}
                          </Typography>
                        </Box>

                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 2
                          }}
                        >
                          {conv.lastMessage || 'Mesaj yok'}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            size="small"
                            label={`${conv.messageCount || 0} mesaj`}
                            color="primary"
                            variant="outlined"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv._id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Konuşma Detayı - {selectedConversation?.course?.name}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedConversation?.messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                  {format(new Date(message.timestamp), 'HH:mm', { locale: tr })}
                </Typography>
              </Paper>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ConversationHistory; 