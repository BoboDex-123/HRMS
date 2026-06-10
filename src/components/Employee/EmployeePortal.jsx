import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemText, Toolbar,
  AppBar, Typography, Button, ListItemIcon, IconButton, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Home as HomeIcon, EventNote as LeaveIcon, Logout as LogoutIcon,
  ListAlt as MyLeavesIcon, Menu as MenuIcon, AccessTime as TimesheetIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import EmployeeHome from './EmployeeHome';
import LeaveForm from './LeaveForm';
import MyLeaves from './MyLeaves';
import Timesheet from './Timesheet';
import MyProfile from './MyProfile';
import { clearEmployeeSession, getEmployeeEmail } from '../../employeeAuth';

const drawerWidth = 240;

const EmployeePortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
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
    { label: 'Timesheet', icon: <TimesheetIcon />, path: '/employee-portal/timesheet' },
    { label: 'My Profile', icon: <ProfileIcon />, path: '/employee-portal/profile' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', pt: 1 }}>
      <List disablePadding>
        {navItems.map(({ label, icon, path }) => {
          const active = location.pathname === path || (path !== '/employee-portal' && location.pathname.startsWith(path));
          return (
            <ListItemButton
              key={label}
              selected={active}
              onClick={() => handleNavigate(path)}
              sx={{ mx: 1, my: 0.5, borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 600 : 400 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700}>HRMS</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {email && !isMobile && (
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{email}</Typography>
            )}
            <Button color="inherit" size="small" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Routes>
          <Route index element={<EmployeeHome />} />
          <Route path="leave" element={<LeaveForm />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="timesheet" element={<Timesheet />} />
          <Route path="profile" element={<MyProfile />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default EmployeePortal;
