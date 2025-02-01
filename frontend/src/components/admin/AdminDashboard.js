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
  styled
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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
  const [openDialog, setOpenDialog] = useState(false);
  const [courseForm, setCourseForm] = useState({
    code: '',
    category: '',
    apiConfig: {
      host: '',
      chatbotId: '',
      securityKey: ''
    }
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
      const [usersRes, coursesRes, conversationsRes] = await Promise.all([
        axios.get('http://34.28.93.220:5000/api/users', config),
        axios.get('http://34.28.93.220:5000/api/courses', config),
        axios.get('http://34.28.93.220:5000/api/chat/all', config)
      ]);

      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setConversations(conversationsRes.data);
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
        `http://34.28.93.220:5000/api/users/${userId}/approve`,
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
        `http://34.28.93.220:5000/api/users/${userId}/ban`,
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
      await axios.post('http://34.28.93.220:5000/api/courses', courseForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenDialog(false);
      setCourseForm({
        code: '',
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
      await axios.delete(`http://34.28.93.220:5000/api/courses/${courseCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      console.error('Ders silinirken hata:', error);
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
          <Tab label="Dersler" />
          <Tab label="Konuşmalar" />
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
                    <TableCell>Kategori</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.code}>
                      <TableCell>{course.code}</TableCell>
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

        {tabValue === 2 && (
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Konuşma Geçmişi
            </Typography>
            <TableContainerStyled>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell>Ders</TableCell>
                    <TableCell>Mesaj Sayısı</TableCell>
                    <TableCell>Son Güncelleme</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conversations.map((conv) => (
                    <TableRow key={conv._id}>
                      <TableCell>{conv.user.name}</TableCell>
                      <TableCell>{conv.courseCode}</TableCell>
                      <TableCell>{conv.messages.length}</TableCell>
                      <TableCell>
                        {new Date(conv.updatedAt).toLocaleString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainerStyled>
          </StyledPaper>
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Yeni Ders Ekle</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Ders Kodu"
              fullWidth
              value={courseForm.code}
              onChange={(e) =>
                setCourseForm({ ...courseForm, code: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Kategori"
              fullWidth
              value={courseForm.category}
              onChange={(e) =>
                setCourseForm({ ...courseForm, category: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="API Host"
              fullWidth
              value={courseForm.apiConfig.host}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  apiConfig: { ...courseForm.apiConfig, host: e.target.value }
                })
              }
            />
            <TextField
              margin="dense"
              label="Chatbot ID"
              fullWidth
              value={courseForm.apiConfig.chatbotId}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  apiConfig: { ...courseForm.apiConfig, chatbotId: e.target.value }
                })
              }
            />
            <TextField
              margin="dense"
              label="Security Key"
              fullWidth
              value={courseForm.apiConfig.securityKey}
              onChange={(e) =>
                setCourseForm({
                  ...courseForm,
                  apiConfig: {
                    ...courseForm.apiConfig,
                    securityKey: e.target.value
                  }
                })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>İptal</Button>
            <Button onClick={handleAddCourse} color="primary">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Root>
  );
};

export default AdminDashboard; 