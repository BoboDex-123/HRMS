import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Skeleton } from '@mui/material';
import {
  Assignment as OnboardingIcon,
  EventNote as LeaveIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getEmployeeEmail, getEmployeeToken } from '../../employeeAuth';
import { motion } from 'framer-motion';
import config from '../../config';

const statusChipColor = (status) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'error';
  return 'warning';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const StatCard = ({ title, value, subtitle, icon, color, delay, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}20`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={64} height={42} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 700, color, mb: 1 }}>
                {value}
              </Typography>
            )}
            {subtitle && !loading && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: `${color}15`, color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const EmployeeHome = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUserName(getEmployeeEmail() || 'Employee');

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/employee/dashboard`, {
          headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
        if (res.ok) setDashboard(await res.json());
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const onboarding = dashboard?.onboardingStatus;
  const onboardingValue = onboarding || 'Not started';
  const onboardingColor = onboarding === 'Approved' ? '#22d3a3' : onboarding === 'Rejected' ? '#f87171' : '#fbbf24';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome back!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body1" color="text.secondary">
              {userName}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Onboarding Status"
            value={onboardingValue}
            subtitle={onboarding === 'Approved' ? 'All documents verified' : onboarding ? 'Under review' : 'Submit your documents'}
            icon={onboarding === 'Approved' ? <CheckIcon /> : <OnboardingIcon />}
            color={onboardingColor}
            delay={0.1}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Leave Balance"
            value={dashboard ? dashboard.leaveBalance : '—'}
            subtitle={dashboard ? `of ${dashboard.leaveAllowance} days this year` : ''}
            icon={<LeaveIcon />}
            color="#f5a623"
            delay={0.2}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Requests"
            value={dashboard ? dashboard.pendingRequests : '—'}
            subtitle="Awaiting approval"
            icon={<PendingIcon />}
            color="#818cf8"
            delay={0.3}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<LeaveIcon />}
                  onClick={() => navigate('leave')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Apply for Leave
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OnboardingIcon />}
                  onClick={() => navigate('/employee/onboarding')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Update Documents
                </Button>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Activity
              </Typography>
              {loading && (
                <>
                  <Skeleton height={32} sx={{ mb: 1 }} />
                  <Skeleton height={32} sx={{ mb: 1 }} />
                  <Skeleton height={32} />
                </>
              )}
              {!loading && (!dashboard || dashboard.recentActivity.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No activity yet. Submit a leave request or complete onboarding to get started.
                </Typography>
              )}
              {!loading && dashboard && dashboard.recentActivity.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dashboard.recentActivity.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {item.label}
                        <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                          {formatDate(item.at)}
                        </Typography>
                      </Typography>
                      <Chip label={item.status} size="small" color={statusChipColor(item.status)} />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeHome;
