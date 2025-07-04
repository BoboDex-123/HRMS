import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';

const LeaveForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setOpenSnackbar(true);
    setFormData({ name: '', email: '', leaveType: '', startDate: '', endDate: '', reason: '' });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)',
        padding: 2
      }}
    >
      <Paper
        component={motion.div}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        elevation={6}
        sx={{ padding: 4, borderRadius: 4, maxWidth: 500, width: '100%' }}
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
          >
            Submit Application
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Leave application submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveForm;
