import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Box,
  Toolbar,
  AppBar as MuiAppBar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#4527a0',
        light: '#7953d2',
        dark: '#000070',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#7c4dff',
        light: '#b47cff',
        dark: '#3f1dcb',
        contrastText: '#ffffff'
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff'
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
        marginBottom: '1rem'
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        marginBottom: '0.75rem'
      },
      h6: {
        fontWeight: 500
      },
      button: {
        textTransform: 'none',
        fontWeight: 500
      }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            textTransform: 'none',
            fontWeight: 500
          },
          containedPrimary: {
            '&:hover': {
              boxShadow: '0 4px 8px rgba(69, 39, 160, 0.2)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8
            }
          }
        }
      }
    }
  });

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    history.push('/profile');
  };

  const handleDashboard = () => {
    handleClose();
    history.push(user?.role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleLogout = () => {
    handleClose();
    logout();
    history.push('/');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const isLoginPage = location.pathname === '/' || location.pathname === '/register';

  if (isLoginPage) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <MuiAppBar position="fixed" elevation={0}>
          <Toolbar>
            <SchoolIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              MYO AI
            </Typography>
            
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title={darkMode ? 'Açık Tema' : 'Koyu Tema'}>
                  <IconButton color="inherit" onClick={toggleDarkMode}>
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>

                <Typography variant="body2" sx={{ mr: 2 }}>
                  {user.name}
                </Typography>

                <Tooltip title="Hesap ayarları">
                  <IconButton
                    size="large"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                      mt: 1.5,
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1,
                        gap: 1.5
                      }
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleDashboard}>
                    {user.role === 'admin' ? <AdminIcon fontSize="small" /> : <DashboardIcon fontSize="small" />}
                    {user.role === 'admin' ? 'Admin Paneli' : 'Ana Sayfa'}
                  </MenuItem>
                  <MenuItem onClick={handleProfile}>
                    <PersonIcon fontSize="small" />
                    Profil
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" />
                    Çıkış Yap
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Toolbar>
        </MuiAppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            minHeight: '100vh',
            bgcolor: 'background.default',
            mt: '64px'
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout; 