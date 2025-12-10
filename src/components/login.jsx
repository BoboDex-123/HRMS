import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, Paper, Typography, Container } from '@mui/material';
import { Person as PersonIcon, AdminPanelSettings as AdminIcon, HowToReg as OnboardingIcon } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                HRMS Portal
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Employee Onboarding & Management System
              </Typography>
            </motion.div>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/employee-login')}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Employee Login
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<AdminIcon />}
                  onClick={() => navigate('/admin-login')}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    borderColor: '#764ba2',
                    color: '#764ba2',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#5a3d7a',
                      backgroundColor: 'rgba(118, 75, 162, 0.04)',
                    },
                  }}
                >
                  Admin Login
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  fullWidth
                  variant="text"
                  size="large"
                  startIcon={<OnboardingIcon />}
                  onClick={() => navigate('/employee/onboarding')}
                  sx={{
                    py: 1.5,
                    fontSize: '0.95rem',
                    color: '#667eea',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    },
                  }}
                >
                  New Employee? Start Onboarding
                </Button>
              </motion.div>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block' }}>
              Internal Tool - Authorized Users Only
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;
