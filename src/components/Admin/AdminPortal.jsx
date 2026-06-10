import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';
import EmployeeApprovals from './EmployeeApprovals';
import LeaveApprovals from './LeaveApprovals';
import CreateEmployee from './CreateEmployee';
import ManageAdmins from './ManageAdmins';
import ChangePassword from './ChangePassword';
import { apiFetch } from '../../api';

const AdminPortal = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'superadmin'
  const [submissions, setSubmissions] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
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
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (data.success) {
        setUserRole(data.role || 'admin');
        setIsAuthenticated(true);
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminRole', data.role || 'admin');
        fetchSubmissions(data.role || 'admin');
        fetchLeaveRequests();
      } else {
        showMessage(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showMessage(err.status ? err.message : 'Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('admin');
    setSubmissions([]);
    setFileUrls({});
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminRole');
  };

  // Admin API call with shared session-expiry handling. Returns null after
  // logging out on a 401 so callers can simply bail.
  const adminCall = async (path, options = {}) => {
    try {
      return await apiFetch(path, { ...options, auth: 'admin' });
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
        showMessage('Session expired, please login again', 'warning');
        return null;
      }
      throw err;
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const data = await adminCall('/api/leave-requests');
      if (data) setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  const updateLeaveStatus = async (id, newStatus) => {
    try {
      const result = await adminCall('/api/leave-status', {
        method: 'POST',
        body: { id, status: newStatus },
      });
      if (!result) return;
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      showMessage(`Leave ${newStatus.toLowerCase()}`, 'success');
    } catch (err) {
      console.error('Leave status error:', err);
      showMessage('Failed to update leave status', 'error');
    }
  };

  const fetchSubmissions = async (role) => {
    setLoading(true);
    const includeDeleted = (role || userRole) === 'superadmin';
    try {
      const data = await adminCall(
        includeDeleted ? '/api/submissions?includeDeleted=true' : '/api/submissions'
      );
      if (!data) return;
      const list = Array.isArray(data) ? data : data.Items || [];
      setSubmissions(list);

      // Signed download URLs now come inline with each file (one request total, generated
      // server-side) instead of a separate fetch per document.
      const urls = {};
      for (const submission of list) {
        for (const file of submission.files || []) {
          if (file.url) urls[file.key] = file.url;
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
      const result = await adminCall('/api/update-status', {
        method: 'POST',
        body: { id, status: newStatus },
      });
      if (!result) return;
      setSubmissions(submissions.map((s) =>
        s.id === id ? { ...s, status: newStatus } : s
      ));
      setSelectedSubmission(null);
      showMessage(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Status update error:', err);
      showMessage('Failed to update status', 'error');
    }
  };

  const deleteSubmission = async (id) => {
    try {
      const result = await adminCall('/api/submissions/delete', {
        method: 'POST',
        body: { id },
      });
      if (!result) return;
      // For super admin, mark as deleted in local state; for regular admin, remove
      if (userRole === 'superadmin') {
        setSubmissions(submissions.map((s) =>
          s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s
        ));
      } else {
        setSubmissions(submissions.filter((s) => s.id !== id));
      }
      showMessage('Submission deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showMessage('Failed to delete submission', 'error');
    }
  };

  const restoreSubmission = async (id) => {
    try {
      const result = await adminCall('/api/submissions/restore', {
        method: 'POST',
        body: { id },
      });
      if (!result) return;
      setSubmissions(submissions.map((s) =>
        s.id === id ? { ...s, isDeleted: false, deletedAt: null } : s
      ));
      showMessage('Submission restored successfully', 'success');
    } catch (err) {
      console.error('Restore error:', err);
      showMessage('Failed to restore submission', 'error');
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
      setUserRole(savedRole);
      setIsAuthenticated(true);
      fetchSubmissions(savedRole);
      fetchLeaveRequests();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)',
            top: '-20%', left: '-15%',
          },
        }}
      >
        <Paper elevation={3} sx={{
          p: 4, width: 400,
          background: 'rgba(18, 21, 30, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          position: 'relative', zIndex: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
            <Box sx={{ width: 28, height: 28, bgcolor: 'primary.main', borderRadius: '6px', flexShrink: 0 }} />
            <Typography sx={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>HRMS Admin</Typography>
          </Box>
          <Typography sx={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '30px', fontWeight: 600,
            color: 'text.primary', mb: 0.5, letterSpacing: '-0.3px',
          }}>
            Admin sign in.
          </Typography>
          <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 3 }}>
            Enter your admin credentials to access the dashboard.
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2.5, py: 1.3, fontWeight: 600, fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
            </Button>
          </form>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/')}
            sx={{ mt: 1.5, color: 'text.secondary', fontSize: '13px' }}
          >
            ← Back to home
          </Button>
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

  const pendingCount = submissions.filter((s) => !s.isDeleted && s.status === 'Pending').length;
  const approvedCount = submissions.filter((s) => !s.isDeleted && s.status === 'Approved').length;
  const pendingLeave = leaveRequests.filter((r) => r.status === 'Pending').length;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top bar */}
      <Paper elevation={0} sx={{ px: 4, py: 2, borderBottom: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {userRole === 'superadmin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </Typography>
            <Chip
              label={userRole === 'superadmin' ? 'Super Admin' : 'Admin'}
              size="small"
              color={userRole === 'superadmin' ? 'secondary' : 'primary'}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => setChangePasswordOpen(true)}>
              Change Password
            </Button>
            <Button variant="outlined" size="small" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ p: 4 }}>
        {/* Stats bar */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Total Submissions', value: submissions.filter(s => !s.isDeleted).length, icon: <PeopleIcon />, color: '#1976d2' },
            { label: 'Pending Review', value: pendingCount, icon: <PendingIcon />, color: '#f59e0b' },
            { label: 'Approved', value: approvedCount, icon: <ApprovedIcon />, color: '#10b981' },
            { label: 'Leave Requests', value: pendingLeave, icon: <RejectedIcon />, color: '#7c3aed' },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
                  {loading ? '—' : stat.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <Tabs value={tabIndex} onChange={handleTabChange} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tab label={`Employee Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}`} />
            <Tab label={`Leave Approvals${pendingLeave > 0 ? ` (${pendingLeave})` : ''}`} />
            <Tab label="Create Employee" />
            {userRole === 'superadmin' && <Tab label="Manage Admins" />}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabIndex === 0 && (
              <>
                <TextField
                  label="Search by name or email"
                  variant="outlined"
                  fullWidth
                  size="small"
                  sx={{ mb: 3 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                />
                <EmployeeApprovals
                  submissions={submissions}
                  searchTerm={searchTerm}
                  loading={loading}
                  onViewDetails={viewDetails}
                  onDeleteSubmission={deleteSubmission}
                  onRestoreSubmission={restoreSubmission}
                  userRole={userRole}
                />
              </>
            )}

            {tabIndex === 1 && (
              <LeaveApprovals
                leaveRequests={leaveRequests}
                loading={loading}
                onApproveLeave={(id) => updateLeaveStatus(id, 'Approved')}
                onRejectLeave={(id) => updateLeaveStatus(id, 'Rejected')}
              />
            )}

            {tabIndex === 2 && <CreateEmployee />}

            {tabIndex === 3 && userRole === 'superadmin' && <ManageAdmins />}
          </Box>
        </Paper>
      </Box>

      <ChangePassword
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Submission Details Dialog */}
      <Dialog open={Boolean(selectedSubmission)} onClose={() => setSelectedSubmission(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600}>
              {selectedSubmission?.firstName} {selectedSubmission?.lastName}
            </Typography>
            {selectedSubmission && (
              <Chip
                label={selectedSubmission.status}
                size="small"
                color={
                  selectedSubmission.status === 'Approved' ? 'success' :
                  selectedSubmission.status === 'Rejected' ? 'error' : 'warning'
                }
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSubmission && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Personal Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Email', value: selectedSubmission.email },
                  { label: 'Phone', value: selectedSubmission.phone },
                  { label: 'Date of Birth', value: selectedSubmission.dob || '—' },
                  { label: 'PAN Number', value: selectedSubmission.panNumber || '—' },
                  { label: 'Address', value: selectedSubmission.address || '—', full: true },
                ].map(({ label, value, full }) => (
                  <Grid item xs={12} sm={full ? 12 : 6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Education
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'School', value: selectedSubmission.schoolName || '—' },
                  { label: 'College', value: selectedSubmission.collegeName || '—' },
                  { label: 'University (PG)', value: selectedSubmission.universityName || '—' },
                ].map(({ label, value }) => (
                  <Grid item xs={12} sm={4} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>

              {selectedSubmission.files?.length > 0 && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Documents ({selectedSubmission.files.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedSubmission.files.map((file) => (
                      <Grid item xs={12} sm={6} key={file.key}>
                        <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {file.field} — {file.key.split('/').pop()}
                          </Typography>
                          <a href={fileUrls[file.key]} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <Button size="small" variant="outlined">Download</Button>
                          </a>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        {selectedSubmission && selectedSubmission.status === 'Pending' && (
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => updateStatus(selectedSubmission.id, 'Approved')}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => updateStatus(selectedSubmission.id, 'Rejected')}
            >
              Reject
            </Button>
          </DialogActions>
        )}
      </Dialog>

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

export default AdminPortal;
