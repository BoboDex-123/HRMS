import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { getEmployeeEmail, getEmployeeToken } from '../../employeeAuth';
import config from '../../config';

const LeaveForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get current user email on mount
  useEffect(() => {
    const email = getEmployeeEmail();
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.endDate < formData.startDate) {
      setSnackbar({ open: true, message: 'End date cannot be before start date', severity: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.API_URL}/api/leave-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getEmployeeToken()}`
        },
        body: JSON.stringify({
          employeeName: formData.name,
          leaveType: formData.leaveType,
          fromDate: formData.startDate,
          toDate: formData.endDate,
          reason: formData.reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit leave request');
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({ open: true, message: 'Leave application submitted successfully!', severity: 'success' });
        setFormData(prev => ({
          ...prev,
          name: '',
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: ''
        }));
      } else {
        throw new Error(result.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Leave submission error:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to submit leave request', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ maxWidth: 560 }}
    >
      <Paper
        variant="outlined"
        sx={{ padding: 4, borderRadius: 3 }}
      >
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Employee Leave Application
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled
          />
          <TextField
            select
            label="Leave Type"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          >
            <MenuItem value="Sick">Sick Leave</MenuItem>
            <MenuItem value="Casual">Casual Leave</MenuItem>
            <MenuItem value="Vacation">Vacation</MenuItem>
          </TextField>
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            required
          />
          <Button
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
          </Button>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveForm;
