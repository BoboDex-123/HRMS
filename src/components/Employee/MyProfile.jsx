import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, TextField,
  Button, Divider, Snackbar, Alert,
} from '@mui/material';
import { Person as PersonIcon, Description as DocIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiFetch } from '../../api';

const statusColor = (status) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'error';
  return 'warning';
};

const Field = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
  </Box>
);

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState({ phone: '', address: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch('/api/employee/profile', { auth: 'employee' });
        setProfile(data);
        if (data.submission) {
          setContact({ phone: data.submission.phone || '', address: data.submission.address || '' });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/employee/profile', {
        method: 'PATCH',
        auth: 'employee',
        body: contact,
      });
      setSnackbar({ open: true, message: 'Contact details updated', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sub = profile?.submission;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ maxWidth: 760 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>My Profile</Typography>
        {sub && <Chip label={`Onboarding: ${sub.status}`} size="small" color={statusColor(sub.status)} />}
      </Box>

      {/* Account */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Account
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><Field label="Username" value={profile?.username} /></Grid>
          <Grid item xs={12} sm={4}><Field label="Email" value={profile?.email} /></Grid>
          <Grid item xs={12} sm={4}>
            <Field
              label="Member since"
              value={profile?.memberSince && new Date(profile.memberSince).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            />
          </Grid>
        </Grid>
      </Paper>

      {!sub && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PersonIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No onboarding submission found</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Complete onboarding to see your personal details and documents here.
          </Typography>
        </Box>
      )}

      {sub && (
        <>
          {/* Personal details (HR-owned, read-only) */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><Field label="Name" value={`${sub.firstName || ''} ${sub.lastName || ''}`.trim()} /></Grid>
              <Grid item xs={12} sm={6}><Field label="Date of Birth" value={sub.dob} /></Grid>
              <Grid item xs={12} sm={6}><Field label="PAN Number" value={sub.panNumber} /></Grid>
              <Grid item xs={12} sm={6}><Field label="School" value={sub.schoolName} /></Grid>
              <Grid item xs={12} sm={6}><Field label="College" value={sub.collegeName} /></Grid>
              <Grid item xs={12} sm={6}><Field label="University (PG)" value={sub.universityName} /></Grid>
            </Grid>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
              Contact HR to correct any of the details above.
            </Typography>
          </Paper>

          {/* Contact details (employee-editable) */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Contact Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Phone"
                  fullWidth
                  size="small"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Address"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Contact Details'}
            </Button>
          </Paper>

          {/* Documents */}
          {sub.files?.length > 0 && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                My Documents ({sub.files.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {sub.files.map((file) => (
                  <Grid item xs={12} sm={6} key={file.key}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <DocIcon sx={{ color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
                        <Typography variant="body2" noWrap>
                          {file.field}
                        </Typography>
                      </Box>
                      {file.url ? (
                        <a href={file.url} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                          <Button size="small" variant="outlined">Download</Button>
                        </a>
                      ) : (
                        <Typography variant="caption" color="text.disabled">Unavailable</Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyProfile;
