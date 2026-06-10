import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, CircularProgress, TextField, Snackbar, Alert,
} from '@mui/material';
import { apiFetch } from '../../api';

// Standalone admin login page (/admin-login). On success the token and role
// land in sessionStorage and we hand off to the dashboard at /admin.
const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Already signed in? Straight to the dashboard.
  useEffect(() => {
    if (sessionStorage.getItem('adminToken')) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (data.success) {
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminRole', data.role || 'admin');
        navigate('/admin', { replace: true });
      } else {
        setSnackbar({ open: true, message: data.message || 'Login failed', severity: 'error' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setSnackbar({
        open: true,
        message: err.status ? err.message : 'Unable to connect to server',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)',
          top: '-20%', left: '-15%',
        },
      }}
    >
      <Paper elevation={3} sx={{
        p: 4, width: 400,
        background: 'rgba(18, 21, 30, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '18px',
        position: 'relative', zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
          <Box sx={{ width: 28, height: 28, bgcolor: 'primary.main', borderRadius: '6px', flexShrink: 0 }} />
          <Typography sx={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>HRMS Admin</Typography>
        </Box>
        <Typography sx={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '30px', fontWeight: 600,
          color: 'text.primary', mb: 0.5, letterSpacing: '-0.3px',
        }}>
          Admin sign in.
        </Typography>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 3 }}>
          Enter your admin credentials to access the dashboard.
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            margin="normal"
            size="small"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2.5, py: 1.3, fontWeight: 600, fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
          </Button>
        </form>
        <Button
          fullWidth
          variant="text"
          onClick={() => navigate('/')}
          sx={{ mt: 1.5, color: 'text.secondary', fontSize: '13px' }}
        >
          ← Back to home
        </Button>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLogin;
