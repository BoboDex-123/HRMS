import React, { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, CircularProgress, Snackbar, Alert
} from '@mui/material';

const CreateEmployee = () => {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSnackbarOpen(true);
        setFormData({ username: '', email: '' });
      } else {
        const error = await res.json();
        alert('Error: ' + error.message);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
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
          <Button type="submit" fullWidth variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Employee'}
          </Button>
        </form>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert severity="success">Employee account created!</Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default CreateEmployee;
