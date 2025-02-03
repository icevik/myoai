import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Divider,
  styled,
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  Logout as LogoutIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ServerMonitoring from './ServerMonitoring';
import Reports from './Reports';

const API_URL = '/api';

const Root = styled('div')(({ theme }) => ({
  flexGrow: 1,
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh'
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  marginBottom: theme.spacing(4)
}));

const Title = styled(Typography)(({ theme }) => ({
  flexGrow: 1
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3)
}));

const AddButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

const TableContainerStyled = styled(TableContainer)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

const AdminDashboard = () => {
  const history = useHistory();
  const { logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    category: '',
    apiConfig: {
      host: '',
      chatbotId: '',
      securityKey: ''
    }
  });
  const [categories, setCategories] = useState([]);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const [usersRes, coursesRes, conversationsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/users`, config),
        axios.get(`${API_URL}/courses`, config),
        axios.get(`${API_URL}/chat/conversations`, config),
        axios.get(`${API_URL}/categories`, config)
      ]);

      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setConversations(conversationsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    logout();
    history.push('/');
  };

  const handleApproveUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/${userId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      loadData();
    } catch (error) {
      console.error('Kullanıcı onaylanırken hata:', error);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/users/${userId}/ban`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      loadData();
    } catch (error) {
      console.error('Kullanıcı banlanırken hata:', error);
    }
  };

  const handleAddCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/courses`, courseForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenDialog(false);
      setCourseForm({
        code: '',
        name: '',
        category: '',
        apiConfig: {
          host: '',
          chatbotId: '',
          securityKey: ''
        }
      });
      loadData();
    } catch (error) {
      console.error('Ders eklenirken hata:', error);
    }
  };

  const handleDeleteCourse = async (courseCode) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/courses/${courseCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      console.error('Ders silinirken hata:', error);
    }
  };

  const handleViewConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/chat/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSelectedConversation(response.data);
      setOpenChatDialog(true);
    } catch (error) {
      console.error('Konuşma detayları alınırken hata:', error);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/chat/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      loadData();
    } catch (error) {
      console.error('Konuşma silinirken hata:', error);
    }
  };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/categories`, categoryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenCategoryDialog(false);
      setCategoryForm({
        code: '',
        name: '',
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Kategori eklenirken hata:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
    }
  };

  return (
    <Root>
      <StyledAppBar position="static">
        <Toolbar>
          <Title variant="h6">
            Admin Paneli
          </Title>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          indicatorColor="secondary"
          textColor="inherit"
        >
          <Tab label="Kullanıcılar" />
          <Tab label="Kategoriler" />
          <Tab label="Dersler" />
          <Tab label="Konuşmalar" />
          <Tab label="Sunucu Durumu" />
          <Tab label="Raporlar" />
        </Tabs>
      </StyledAppBar>

      <Container>
        {tabValue === 0 && (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Yönetimi
            </Typography>
            <TableContainerStyled>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ad Soyad</TableCell>
                    <TableCell>E-posta</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.isApproved ? 'Onaylı' : 'Beklemede'}
                      </TableCell>
                      <TableCell>
                        {!user.isApproved ? (
                          <IconButton
                            color="primary"
                            onClick={() => handleApproveUser(user._id)}
                          >
                            <CheckIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            color="error"
                            onClick={() => handleBanUser(user._id)}
                          >
                            <BlockIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainerStyled>
          </StyledPaper>
        )}

        {tabValue === 1 && (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Kategori Yönetimi
            </Typography>
            <AddButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenCategoryDialog(true)}
            >
              Yeni Kategori Ekle
            </AddButton>
            <TableContainerStyled>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kategori Kodu</TableCell>
                    <TableCell>Kategori Adı</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>{category.code}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteCategory(category._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainerStyled>
          </StyledPaper>
        )}

        {tabValue === 2 && (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Ders Yönetimi
            </Typography>
            <AddButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Yeni Ders Ekle
            </AddButton>
            <TableContainerStyled>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ders Kodu</TableCell>
                    <TableCell>Ders Adı</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.code}>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{course.category}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteCourse(course.code)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainerStyled>
          </StyledPaper>
        )}

        {tabValue === 3 && (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Konuşma Geçmişi
            </Typography>
            <List>
              {conversations.map((conversation) => (
                <React.Fragment key={conversation._id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <IconButton
                          edge="end"
                          onClick={() => handleViewConversation(conversation._id)}
                        >
                          <ChatIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDeleteConversation(conversation._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={`${conversation.userId.name} - ${conversation.courseCode}`}
                      secondary={format(new Date(conversation.lastMessageAt), 'PPpp', { locale: tr })}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        )}

        {tabValue === 4 && (
          <StyledPaper>
            <ServerMonitoring />
          </StyledPaper>
        )}

        {tabValue === 5 && (
          <StyledPaper>
            <Reports />
          </StyledPaper>
        )}

        {/* Ders Ekleme Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Yeni Ders Ekle</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ders Kodu"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ders Adı"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name} ({category.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Host"
                  value={courseForm.apiConfig.host}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    apiConfig: { ...courseForm.apiConfig, host: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chatbot ID"
                  value={courseForm.apiConfig.chatbotId}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    apiConfig: { ...courseForm.apiConfig, chatbotId: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Güvenlik Anahtarı"
                  value={courseForm.apiConfig.securityKey}
                  onChange={(e) => setCourseForm({
                    ...courseForm,
                    apiConfig: { ...courseForm.apiConfig, securityKey: e.target.value }
                  })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>İptal</Button>
            <Button onClick={handleAddCourse} color="primary">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Konuşma Detay Dialog */}
        <Dialog
          open={openChatDialog}
          onClose={() => setOpenChatDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Konuşma Detayı
          </DialogTitle>
          <DialogContent>
            {selectedConversation && (
              <List>
                {selectedConversation.messages.map((message, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={message.role === 'user' ? selectedConversation.userId.name : 'Bot'}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {format(new Date(message.timestamp), 'PPpp', { locale: tr })}
                          </Typography>
                          <Typography component="p">
                            {message.content}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenChatDialog(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>

        {/* Kategori Ekleme Dialog */}
        <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)}>
          <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Kategori Kodu"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Kategori Adı"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCategoryDialog(false)}>İptal</Button>
            <Button onClick={handleAddCategory} color="primary">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Root>
  );
};

export default AdminDashboard; 