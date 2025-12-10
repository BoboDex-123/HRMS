import React, { useState } from 'react';
import { signIn, confirmSignIn } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';

const EmployeeAuthLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn({ username, password });

      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setNeedsNewPassword(true);
      } else if (result.isSignedIn) {
        navigate('/employee-portal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleCompleteNewPassword = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (result.isSignedIn) {
        navigate('/employee-portal');
      }
    } catch (err) {
      console.error('New password error:', err);
      setError(err.message || 'Password update failed');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 600, mb: 3 }}>
            {needsNewPassword ? 'Set New Password' : 'Employee Login'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!needsNewPassword ? (
            <>
              <TextField
                label="Username / Email"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <TextField
                label="Password"
                fullWidth
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleSignIn}
                disabled={loading || !username || !password}
                sx={{ mt: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your temporary password has expired. Please set a new password.
              </Typography>
              <TextField
                label="New Password"
                fullWidth
                type="password"
                margin="normal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCompleteNewPassword()}
                helperText="Must be at least 8 characters"
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleCompleteNewPassword}
                disabled={loading || !newPassword || newPassword.length < 8}
                sx={{ mt: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Set New Password'}
              </Button>
            </>
          )}

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default EmployeeAuthLogin;
