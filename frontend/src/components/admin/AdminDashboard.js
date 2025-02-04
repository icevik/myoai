import React, { useState, useEffect } from 'react';
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
  Box,
  Alert,
  Chip,
  useTheme,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  Chat as ChatIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ServerMonitoring from './ServerMonitoring';
import Reports from './Reports';

const API_URL = '/api';

const AdminDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
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
    welcomeMessage: '',
    isPublic: true,
    allowedUsers: [],
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
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

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
      const conversationArray = Object.values(conversationsRes.data.conversations)
        .flat()
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setConversations(conversationArray);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      setError('Kullanıcı onaylanırken bir hata oluştu');
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
      setError('Kullanıcı banlanırken bir hata oluştu');
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      code: course.code,
      name: course.name,
      category: course.category?._id || course.category,
      welcomeMessage: course.welcomeMessage || '',
      isPublic: course.isPublic,
      allowedUsers: course.allowedUsers || [],
      apiConfig: {
        host: course.apiConfig?.host || '',
        chatbotId: course.apiConfig?.chatbotId || '',
        securityKey: course.apiConfig?.securityKey || ''
      }
    });
    setOpenDialog(true);
  };

  const handleAddCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      if (selectedCourse) {
        await axios.put(`${API_URL}/courses/${selectedCourse.code}`, courseForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/courses`, courseForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setOpenDialog(false);
      setSelectedCourse(null);
      setCourseForm({
        code: '',
        name: '',
        category: '',
        welcomeMessage: '',
        isPublic: true,
        allowedUsers: [],
        apiConfig: {
          host: '',
          chatbotId: '',
          securityKey: ''
        }
      });
      loadData();
    } catch (error) {
      console.error('Ders işlemi sırasında hata:', error);
      setError('Ders işlemi sırasında bir hata oluştu');
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
      setError('Ders silinirken bir hata oluştu');
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
      
      const conversation = {
        ...response.data,
        user: users.find(u => u._id === response.data.user),
        course: courses.find(c => c._id === response.data.course)
      };
      
      setSelectedConversation(conversation);
      setOpenChatDialog(true);
    } catch (error) {
      console.error('Konuşma detayları alınırken hata:', error);
      setError('Konuşma detayları alınırken bir hata oluştu');
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
      setError('Konuşma silinirken bir hata oluştu');
    }
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      code: category.code,
      name: category.name,
      description: category.description || ''
    });
    setOpenCategoryDialog(true);
  };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (selectedCategory) {
        await axios.put(
          `${API_URL}/categories/${selectedCategory._id}`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/categories`,
          categoryForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setOpenCategoryDialog(false);
      setSelectedCategory(null);
      setCategoryForm({
        code: '',
        name: '',
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Kategori işlemi sırasında hata:', error);
      setError('Kategori işlemi sırasında bir hata oluştu');
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
      setError('Kategori silinirken bir hata oluştu');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setOpenUserDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const updateData = { ...userForm };
      
      if (!updateData.password) {
        delete updateData.password;
      }

      await axios.put(
        `${API_URL}/users/${selectedUser._id}`,
        updateData,
        { headers }
      );

      if (userForm.role !== selectedUser.role) {
        await axios.put(
          `${API_URL}/users/${selectedUser._id}/role`,
          { role: userForm.role },
          { headers }
        );
      }

      setOpenUserDialog(false);
      setSelectedUser(null);
      setUserForm({
        name: '',
        email: '',
        role: '',
        password: ''
      });
      loadData();
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata:', error);
      setError('Kullanıcı güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadData();
      } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        setError('Kullanıcı silinirken bir hata oluştu');
      }
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={0} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            indicatorColor="primary"
            textColor="primary"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              borderRadius: '12px 12px 0 0'
            }}
          >
            <Tab label="Kullanıcılar" />
            <Tab label="Kategoriler" />
            <Tab label="Dersler" />
            <Tab label="Konuşmalar" />
            <Tab label="Sunucu Durumu" />
            <Tab label="Raporlar" />
          </Tabs>
        </Paper>

        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Paper elevation={0}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ad</TableCell>
                      <TableCell>E-posta</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={String(user._id)}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role === 'admin' ? 'Admin' : 'Öğrenci'}
                            color={user.role === 'admin' ? 'secondary' : 'primary'}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isApproved ? 'Onaylı' : 'Onay Bekliyor'}
                            color={user.isApproved ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditUser(user)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          {!user.isApproved && (
                            <IconButton
                              color="success"
                              onClick={() => handleApproveUser(user._id)}
                              size="small"
                            >
                              <CheckIcon />
                            </IconButton>
                          )}
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteUser(user._id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {tabValue === 1 && (
            <Paper elevation={0}>
              <Box sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryForm({
                      code: '',
                      name: '',
                      description: ''
                    });
                    setOpenCategoryDialog(true);
                  }}
                  sx={{ mb: 3 }}
                >
                  Yeni Kategori Ekle
                </Button>
              </Box>
              <TableContainer>
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
                            color="primary"
                            onClick={() => handleEditCategory(category)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteCategory(category._id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper elevation={0}>
              <Box sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ mb: 3 }}
                >
                  Yeni Ders Ekle
                </Button>
              </Box>
              <TableContainer>
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
                      <TableRow key={String(course._id)}>
                        <TableCell>{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>
                          {course.category && typeof course.category === 'object'
                            ? course.category.name
                            : course.category}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditCourse(course)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteCourse(course.code)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {tabValue === 3 && (
            <Paper elevation={0}>
              <List>
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
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
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {conversation.user?.name || 'Kullanıcı'}
                              </Typography>
                              <Chip
                                label={conversation.course?.code || 'Ders Kodu'}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Son mesaj: {conversation.lastMessage?.substring(0, 50)}...
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(conversation.updatedAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Henüz konuşma bulunmuyor
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          )}

          {tabValue === 4 && (
            <Paper elevation={0}>
              <ServerMonitoring />
            </Paper>
          )}

          {tabValue === 5 && (
            <Paper elevation={0}>
              <Reports />
            </Paper>
          )}
        </Box>
      </Box>

      {/* Ders Ekleme/Düzenleme Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedCourse(null);
          setCourseForm({
            code: '',
            name: '',
            category: '',
            welcomeMessage: '',
            isPublic: true,
            allowedUsers: [],
            apiConfig: {
              host: '',
              chatbotId: '',
              securityKey: ''
            }
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCourse ? 'Ders Düzenle' : 'Yeni Ders Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ders Kodu"
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                disabled={!!selectedCourse}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ders Adı"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  label="Kategori"
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
                label="Karşılama Mesajı"
                value={courseForm.welcomeMessage}
                onChange={(e) => setCourseForm({ ...courseForm, welcomeMessage: e.target.value })}
                multiline
                rows={3}
                helperText="Öğrenci derse girdiğinde gösterilecek karşılama mesajı"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={courseForm.isPublic}
                    onChange={(e) => setCourseForm({ ...courseForm, isPublic: e.target.checked })}
                  />
                }
                label="Herkese Açık"
              />
            </Grid>
            {!courseForm.isPublic && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>İzin Verilen Kullanıcılar</InputLabel>
                  <Select
                    multiple
                    value={courseForm.allowedUsers}
                    onChange={(e) => setCourseForm({ ...courseForm, allowedUsers: e.target.value })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((userId) => {
                          const user = users.find(u => u._id === userId);
                          return (
                            <Chip
                              key={userId}
                              label={user ? user.name : userId}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {users.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                API Yapılandırması
              </Typography>
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
                helperText="Örnek: https://www.example.com"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Chatbot ID"
                value={courseForm.apiConfig.chatbotId}
                onChange={(e) => setCourseForm({
                  ...courseForm,
                  apiConfig: { ...courseForm.apiConfig, chatbotId: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Güvenlik Anahtarı"
                value={courseForm.apiConfig.securityKey}
                onChange={(e) => setCourseForm({
                  ...courseForm,
                  apiConfig: { ...courseForm.apiConfig, securityKey: e.target.value }
                })}
                type="password"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setSelectedCourse(null);
              setCourseForm({
                code: '',
                name: '',
                category: '',
                welcomeMessage: '',
                isPublic: true,
                allowedUsers: [],
                apiConfig: {
                  host: '',
                  chatbotId: '',
                  securityKey: ''
                }
              });
            }}
          >
            İptal
          </Button>
          <Button onClick={handleAddCourse} variant="contained" color="primary">
            {selectedCourse ? 'Güncelle' : 'Ekle'}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Konuşma Detayı - {selectedConversation?.course?.name || 'Yükleniyor...'}
            </Typography>
            <IconButton onClick={() => setOpenChatDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedConversation && (
            <List>
              {selectedConversation.messages.map((message, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                          {message.role === 'user' ? selectedConversation.user?.name || 'Kullanıcı' : 'Bot'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(message.timestamp), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        sx={{ whiteSpace: 'pre-wrap', mt: 1 }}
                      >
                        {message.content}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Kategori Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={() => {
          setOpenCategoryDialog(false);
          setSelectedCategory(null);
          setCategoryForm({
            code: '',
            name: '',
            description: ''
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kategori Kodu"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                disabled={!!selectedCategory}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kategori Adı"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCategoryDialog(false);
            setSelectedCategory(null);
            setCategoryForm({
              code: '',
              name: '',
              description: ''
            });
          }}>
            İptal
          </Button>
          <Button onClick={handleAddCategory} variant="contained" color="primary">
            {selectedCategory ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kullanıcı Düzenleme Dialog */}
      <Dialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ad"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  label="Rol"
                >
                  <MenuItem value="user">Öğrenci</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Şifre"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                helperText={selectedUser ? 'Boş bırakırsanız şifre değişmez' : ''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>İptal</Button>
          <Button onClick={handleUpdateUser} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 