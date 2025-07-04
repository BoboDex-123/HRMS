import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import EmployeeApprovals from './EmployeeApprovals';
import LeaveApprovals from './LeaveApprovals'; 
import CreateEmployee from './CreateEmployee';

const AdminPortal = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]); 

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        fetchSubmissions();
      } else {
        const error = await response.json();
        alert(error.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Server error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/submissions');
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.Items || [];

      setSubmissions(list);

      const urls = {};
      for (const submission of list) {
        if (submission.files) {
          for (const file of submission.files) {
            const res = await fetch(`http://localhost:5000/api/s3-url?key=${file.key}`);
            const { url } = await res.json();
            urls[file.key] = url;
          }
        }
      }
      setFileUrls(urls);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch('http://localhost:5000/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const updated = submissions.map((s) =>
          s.id === id ? { ...s, status: newStatus } : s
        );
        setSubmissions(updated);
        setSelectedSubmission(null);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Server error');
    }
  };

  const viewDetails = (submission) => {
    setSelectedSubmission(submission);
  };

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: 400 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
            Admin Portal Login
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Employee Approvals" />
        <Tab label="Leave Approvals" />
        <Tab label="Create Employee Login" />
      </Tabs>

      <TextField
        label="Search by name or email"
        variant="outlined"
        fullWidth
        sx={{ mb: 3 }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
      />

      {tabIndex === 0 && (
        <EmployeeApprovals
          submissions={submissions}
          searchTerm={searchTerm}
          loading={loading}
          onViewDetails={viewDetails}
        />
      )}

      {tabIndex === 1 && (
        <LeaveApprovals
          leaveRequests={leaveRequests}
          loading={loading}
          onApproveLeave={(id) => updateStatus(id, 'Leave Approved')}
          onRejectLeave={(id) => updateStatus(id, 'Leave Rejected')}
        />
      )}

      {tabIndex === 2 && <CreateEmployee />}


      <Dialog
        open={Boolean(selectedSubmission)}
        onClose={() => setSelectedSubmission(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submission Details: {selectedSubmission?.firstName} {selectedSubmission?.lastName}
        </DialogTitle>
        <DialogContent dividers>
          {selectedSubmission && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>
                    <strong>Email:</strong> {selectedSubmission.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    <strong>Phone:</strong> {selectedSubmission.phone}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Documents
              </Typography>
              <Grid container spacing={2}>
                {selectedSubmission.files?.map((file) => (
                  <Grid item xs={12} md={6} key={file.key}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="subtitle1">
                        {file.key.split('/').pop()}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <a
                          href={fileUrls[file.key]}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Button variant="contained">Download</Button>
                        </a>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => updateStatus(selectedSubmission.id, 'Approved')}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => updateStatus(selectedSubmission.id, 'Rejected')}
                >
                  Reject
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminPortal;
