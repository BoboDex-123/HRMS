import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemText, Toolbar,
  AppBar, Typography, Button, ListItemIcon
} from '@mui/material';
import { Home as HomeIcon, EventNote as LeaveIcon, Logout as LogoutIcon, ListAlt as MyLeavesIcon } from '@mui/icons-material';
import EmployeeHome from './EmployeeHome';
import LeaveForm from './LeaveForm';
import MyLeaves from './MyLeaves';
import { clearEmployeeSession, getEmployeeEmail } from '../../employeeAuth';

const drawerWidth = 240;

const EmployeePortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = getEmployeeEmail();

  const handleLogout = () => {
    clearEmployeeSession();
    sessionStorage.clear();
    navigate('/');
  };

  const navItems = [
    { label: 'Home', icon: <HomeIcon />, path: '/employee-portal' },
    { label: 'Apply for Leave', icon: <LeaveIcon />, path: '/employee-portal/leave' },
    { label: 'My Leave Requests', icon: <MyLeavesIcon />, path: '/employee-portal/my-leaves' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>HRMS</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {email && (
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{email}</Typography>
            )}
            <Button color="inherit" size="small" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
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
        <Box sx={{ overflow: 'auto', pt: 1 }}>
          <List disablePadding>
            {navItems.map(({ label, icon, path }) => {
              const active = location.pathname === path || (path !== '/employee-portal' && location.pathname.startsWith(path));
              return (
                <ListItemButton
                  key={label}
                  selected={active}
                  onClick={() => navigate(path)}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '& .MuiListItemIcon-root': { color: 'white' },
                      '&:hover': { backgroundColor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                  <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 600 : 400 }} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Routes>
          <Route index element={<EmployeeHome />} />
          <Route path="leave" element={<LeaveForm />} />
          <Route path="my-leaves" element={<MyLeaves />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default EmployeePortal;
