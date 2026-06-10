import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, CircularProgress, Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { apiFetch } from '../../api';
import { setEmployeeSession } from '../../employeeAuth';

const EmployeeAuthLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changeToken, setChangeToken] = useState('');
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/employee/login', {
        method: 'POST',
        body: { username, password },
      });
      if (data.mustChangePassword) {
        setChangeToken(data.changeToken);
        setNeedsNewPassword(true);
      } else {
        setEmployeeSession({ token: data.token, email: data.email });
        navigate('/employee-portal');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleCompleteNewPassword = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/employee/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${changeToken}` },
        body: { newPassword },
      });
      setEmployeeSession({ token: data.token, email: data.email });
      navigate('/employee-portal');
    } catch (err) {
      setError(err.message || 'Password update failed');
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      p: 3,
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Dot grid */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none',
      }} />

      {/* Amber glow */}
      <Box sx={{
        position: 'absolute',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)',
        top: '-20%', right: '-10%',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}
      >
        <Box sx={{
          background: 'rgba(18, 21, 30, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          p: 4,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Logo mark */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3.5 }}>
            <Box sx={{ width: 28, height: 28, bgcolor: 'primary.main', borderRadius: '6px', flexShrink: 0 }} />
            <Typography sx={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              HRMS Employee Portal
            </Typography>
          </Box>

          <Typography sx={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '30px', fontWeight: 600,
            color: 'text.primary',
            mb: 0.5, letterSpacing: '-0.3px',
          }}>
            {needsNewPassword ? 'Set new password.' : 'Sign in.'}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 3 }}>
            {needsNewPassword
              ? 'Your temporary password has expired.'
              : 'Enter your credentials to continue.'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '13px' }}>{error}</Alert>
          )}

          {!needsNewPassword ? (
            <>
              <TextField
                label="Username or email"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                size="small"
              />
              <TextField
                label="Password"
                fullWidth
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                size="small"
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSignIn}
                disabled={loading || !username || !password}
                sx={{ mt: 2.5, py: 1.3, fontWeight: 600, fontSize: '14px' }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
              </Button>
            </>
          ) : (
            <>
              <TextField
                label="New password"
                fullWidth
                type="password"
                margin="normal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompleteNewPassword()}
                helperText="Must be at least 8 characters"
                size="small"
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleCompleteNewPassword}
                disabled={loading || !newPassword || newPassword.length < 8}
                sx={{ mt: 2.5, py: 1.3, fontWeight: 600, fontSize: '14px' }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Set Password'}
              </Button>
            </>
          )}

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/')}
            sx={{ mt: 1.5, color: 'text.secondary', fontSize: '13px' }}
          >
            ← Back to home
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

export default EmployeeAuthLogin;
