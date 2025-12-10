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
  Snackbar,
  Alert,
} from '@mui/material';
import EmployeeApprovals from './EmployeeApprovals';
import LeaveApprovals from './LeaveApprovals';
import CreateEmployee from './CreateEmployee';
import config from '../../config';

const AdminPortal = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'superadmin'
  const [submissions, setSubmissions] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${config.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthToken(data.token);
        setUserRole(data.role || 'admin');
        setIsAuthenticated(true);
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminRole', data.role || 'admin');
        fetchSubmissions(data.token, data.role || 'admin');
      } else {
        showMessage(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showMessage('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthToken('');
    setUserRole('admin');
    setSubmissions([]);
    setFileUrls({});
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminRole');
  };

  const fetchSubmissions = async (token, role) => {
    setLoading(true);
    const currentRole = role || userRole;
    const includeDeleted = currentRole === 'superadmin';
    try {
      const url = includeDeleted
        ? `${config.API_URL}/api/submissions?includeDeleted=true`
        : `${config.API_URL}/api/submissions`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token || authToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          showMessage('Session expired, please login again', 'warning');
          return;
        }
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.Items || [];
      setSubmissions(list);

      // Fetch file URLs
      const urls = {};
      for (const submission of list) {
        if (submission.files) {
          for (const file of submission.files) {
            try {
              const res = await fetch(
                `${config.API_URL}/api/s3-url?key=${encodeURIComponent(file.key)}`,
                {
                  headers: { 'Authorization': `Bearer ${token || authToken}` }
                }
              );
              if (res.ok) {
                const { url } = await res.json();
                urls[file.key] = url;
              }
            } catch (err) {
              console.error('Error fetching file URL:', err);
            }
          }
        }
      }
      setFileUrls(urls);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      showMessage('Failed to fetch submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${config.API_URL}/api/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const updated = submissions.map((s) =>
          s.id === id ? { ...s, status: newStatus } : s
        );
        setSubmissions(updated);
        setSelectedSubmission(null);
        showMessage(`Status updated to ${newStatus}`, 'success');
      } else {
        if (res.status === 401) {
          handleLogout();
          showMessage('Session expired, please login again', 'warning');
          return;
        }
        showMessage('Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showMessage('Server error while updating status', 'error');
    }
  };

  const deleteSubmission = async (id) => {
    try {
      const res = await fetch(`${config.API_URL}/api/submissions/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        // For super admin, mark as deleted in local state; for regular admin, remove
        if (userRole === 'superadmin') {
          setSubmissions(submissions.map((s) =>
            s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s
          ));
        } else {
          setSubmissions(submissions.filter((s) => s.id !== id));
        }
        showMessage('Submission deleted successfully', 'success');
      } else {
        if (res.status === 401) {
          handleLogout();
          showMessage('Session expired, please login again', 'warning');
          return;
        }
        showMessage('Failed to delete submission', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showMessage('Server error while deleting submission', 'error');
    }
  };

  const restoreSubmission = async (id) => {
    try {
      const res = await fetch(`${config.API_URL}/api/submissions/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        // Update local state to mark as not deleted
        setSubmissions(submissions.map((s) =>
          s.id === id ? { ...s, isDeleted: false, deletedAt: null } : s
        ));
        showMessage('Submission restored successfully', 'success');
      } else {
        if (res.status === 401) {
          handleLogout();
          showMessage('Session expired, please login again', 'warning');
          return;
        }
        showMessage('Failed to restore submission', 'error');
      }
    } catch (err) {
      console.error('Restore error:', err);
      showMessage('Server error while restoring submission', 'error');
    }
  };

  const viewDetails = (submission) => {
    setSelectedSubmission(submission);
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    const savedRole = sessionStorage.getItem('adminRole') || 'admin';
    if (savedToken) {
      setAuthToken(savedToken);
      setUserRole(savedRole);
      setIsAuthenticated(true);
      fetchSubmissions(savedToken, savedRole);
    }
  }, []);

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
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">
            {userRole === 'superadmin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </Typography>
          {userRole === 'superadmin' && (
            <Typography variant="body2" color="text.secondary">
              You can view and restore deleted submissions
            </Typography>
          )}
        </Box>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

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
          onDeleteSubmission={deleteSubmission}
          onRestoreSubmission={restoreSubmission}
          userRole={userRole}
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

      {tabIndex === 2 && <CreateEmployee authToken={authToken} />}

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

export default AdminPortal;
