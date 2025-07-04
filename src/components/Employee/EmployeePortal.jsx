import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemText, Toolbar, AppBar, Typography, Button } from '@mui/material';
import EmployeeHome from './EmployeeHome';
import LeaveForm from './LeaveForm';

const drawerWidth = 240;

const EmployeePortal = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Employee Portal</Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
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
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem button onClick={() => navigate('leave')}> 
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
