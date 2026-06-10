import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress, Box
} from '@mui/material';
import { apiFetch } from '../../api';

// Dialog for the logged-in admin to change their own password.
const ChangePassword = ({ open, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirm('');
    setError(''); setSuccess(false); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    setError('');
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await apiFetch('/api/admin/change-password', {
        method: 'POST',
        auth: 'admin',
        body: { currentPassword, newPassword },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 1 }}>Password changed successfully.</Alert>
        ) : (
          <Box sx={{ pt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Current Password" type="password" fullWidth margin="dense"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <TextField
              label="New Password" type="password" fullWidth margin="dense"
              helperText="Min 8 characters"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm New Password" type="password" fullWidth margin="dense"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{success ? 'Close' : 'Cancel'}</Button>
        {!success && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !currentPassword || !newPassword || !confirm}
          >
            {loading ? <CircularProgress size={22} /> : 'Update'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChangePassword;
