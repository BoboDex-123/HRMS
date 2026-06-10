import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { apiFetch } from '../../api';

const CreateEmployee = () => {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/create-employee', {
        method: 'POST',
        auth: 'admin',
        body: formData,
      });
      setTempPassword(data.tempPassword || '');
      setSnackbar({
        open: true,
        message: `Employee created. Temporary password: ${data.tempPassword}`,
        severity: 'success',
      });
      setFormData({ username: '', email: '' });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.status ? err.message : 'Network error - unable to connect to server',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h6" gutterBottom>
          Create New Employee Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Employee'}
          </Button>
        </form>
        {tempPassword && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Share this temporary password with the employee — they'll be asked to change it on first login:
            <strong> {tempPassword}</strong>
          </Alert>
        )}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default CreateEmployee;
