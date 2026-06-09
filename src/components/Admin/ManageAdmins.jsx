import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, TextField, Button, Typography, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, CircularProgress, Chip
} from '@mui/material';
import config from '../../config';

// Super-admin-only: create and manage admin accounts (replaces shared env credentials).
const ManageAdmins = ({ authToken }) => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  }), [authToken]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch(`${config.API_URL}/api/admins`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load admins');
      setAdmins(await res.json());
    } catch (err) {
      console.error(err);
      showMessage('Failed to load admins', 'error');
    }
  }, [authHeaders]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/admins`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');
      showMessage(`Admin "${data.username}" created`, 'success');
      setForm({ username: '', email: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (admin) => {
    try {
      const res = await fetch(`${config.API_URL}/api/admins/${admin.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !admin.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      showMessage(`${admin.username} ${data.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchAdmins();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>Create Admin Account</Typography>
        <form onSubmit={handleCreate}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Username" required size="small" sx={{ flex: '1 1 160px' }}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              label="Email" type="email" size="small" sx={{ flex: '1 1 160px' }}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password" type="password" required size="small" sx={{ flex: '1 1 160px' }}
              helperText="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              select label="Role" size="small" sx={{ flex: '1 1 140px' }}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="superadmin">Super Admin</MenuItem>
            </TextField>
          </Box>
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Admin'}
          </Button>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.username}</TableCell>
                <TableCell>{a.email || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={a.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    size="small"
                    color={a.role === 'superadmin' ? 'secondary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={a.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={a.is_active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color={a.is_active ? 'error' : 'success'}
                    onClick={() => toggleActive(a)}
                  >
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

export default ManageAdmins;
