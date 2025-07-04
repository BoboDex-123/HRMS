// src/components/Employee/EmployeeLogin.jsx
import React, { useState } from 'react';
import { Auth } from 'aws-amplify/auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';

const EmployeeLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await Auth.signIn(username, password);

      if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setStep('newPassword');
      } else {
        alert('Login successful!');
        window.location.href = '/employee-portal';
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await Auth.signIn(username, password);
      await Auth.completeNewPassword(user, newPassword);
      alert('Password changed successfully! Please log in again.');
      setStep('login');
      setPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" gutterBottom>
          Employee Login
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={step === 'login' ? handleLogin : handleNewPassword}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label={step === 'login' ? 'Password' : 'Old Password'}
            type="password"
            fullWidth
            margin="normal"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {step === 'newPassword' && (
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="normal"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : (step === 'login' ? 'Login' : 'Set New Password')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default EmployeeLogin;
