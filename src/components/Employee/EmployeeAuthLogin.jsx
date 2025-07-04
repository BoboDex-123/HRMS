import React, { useState } from 'react';
import { signIn, completeNewPassword } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

const EmployeeAuthLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userForNewPassword, setUserForNewPassword] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  const handleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signIn({ username, password });
      console.log('✅ Login successful', user);

      if (user.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD') {
        setUserForNewPassword(user);
      } else {
        navigate('/employee-portal');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      alert(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleCompleteNewPassword = async () => {
    setLoading(true);
    try {
      await completeNewPassword({ user: userForNewPassword, newPassword });
      navigate('/employee-portal');
    } catch (err) {
      console.error('❌ New password error:', err);
      alert(err.message || 'Password update failed');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        Employee Login
      </Typography>

      {!userForNewPassword ? (
        <>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            fullWidth
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </>
      ) : (
        <>
          <TextField
            label="New Password"
            fullWidth
            type="password"
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleCompleteNewPassword}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Set New Password'}
          </Button>
        </>
      )}
    </Box>
  );
};

export default EmployeeAuthLogin;
