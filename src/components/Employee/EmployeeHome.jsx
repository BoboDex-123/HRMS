import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const EmployeeHome = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Employee Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6">Onboarding Status</Typography>
            <Typography color="text.secondary">Completed</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6">Leave Summary</Typography>
            <Typography color="text.secondary">2 Approved | 1 Pending</Typography>
          </Paper>
        </Grid>

       
      </Grid>
    </Box>
  );
};

export default EmployeeHome;
