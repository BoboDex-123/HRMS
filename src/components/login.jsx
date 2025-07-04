import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, Paper, Typography } from '@mui/material';

const Login = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-200"
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
          p: 4,
          mt: 8,
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Choose Login Type
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/employee-login')}
          >
            Employee Login
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/admin-login')}
          >
            Admin Login
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default Login;
