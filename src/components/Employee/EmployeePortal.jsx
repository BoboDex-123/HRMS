import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, Toolbar, AppBar, Typography, Button, ListItemIcon } from '@mui/material';
import { Home as HomeIcon, EventNote as LeaveIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { signOut } from '@aws-amplify/auth';
import EmployeeHome from './EmployeeHome';
import LeaveForm from './LeaveForm';

const drawerWidth = 240;

const EmployeePortal = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      // Clear any local storage
      localStorage.removeItem('amplify-signin-with-hostedUI');
      sessionStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Navigate anyway
      navigate('/');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Employee Portal</Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button onClick={() => navigate('.')}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button onClick={() => navigate('leave')}>
              <ListItemIcon>
                <LeaveIcon />
              </ListItemIcon>
              <ListItemText primary="Apply for Leave" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Routes>
          <Route index element={<EmployeeHome />} />
          <Route path="leave" element={<LeaveForm />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default EmployeePortal;
