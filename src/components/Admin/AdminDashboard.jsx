import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, TextField, Grid, Tabs, Tab, Snackbar, Alert, Chip,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  EventNote as LeaveIcon,
} from '@mui/icons-material';
import EmployeeApprovals from './EmployeeApprovals';
import LeaveApprovals from './LeaveApprovals';
import CreateEmployee from './CreateEmployee';
import ManageAdmins from './ManageAdmins';
import TimesheetReview from './TimesheetReview';
import HolidayManager from './HolidayManager';
import ChangePassword from './ChangePassword';
import SubmissionDetailsDialog from './SubmissionDetailsDialog';
import { apiFetch } from '../../api';

// Route-synced tab definitions. Manage Admins is superadmin-only.
const TAB_PATHS = ['/admin', '/admin/leaves', '/admin/timesheets', '/admin/holidays', '/admin/create-employee', '/admin/manage-admins'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = sessionStorage.getItem('adminRole') || 'admin';

  const [submissions, setSubmissions] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminRole');
    navigate('/admin-login', { replace: true });
  };

  // Admin API call with shared session-expiry handling. Returns null after
  // logging out on a 401 so callers can simply bail.
  const adminCall = async (path, options = {}) => {
    try {
      return await apiFetch(path, { ...options, auth: 'admin' });
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
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

  const fetchSubmissions = async () => {
    setLoading(true);
    const includeDeleted = userRole === 'superadmin';
    try {
      const data = await adminCall(
        includeDeleted ? '/api/submissions?includeDeleted=true' : '/api/submissions'
      );
      if (!data) return;
      const list = Array.isArray(data) ? data : data.Items || [];
      setSubmissions(list);

      // Signed download URLs come inline with each file (generated server-side).
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
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      setSelectedSubmission(null);
      showMessage(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Status update error:', err);
      showMessage('Failed to update status', 'error');
    }
  };

  const updateLeaveStatus = async (id, newStatus, comment) => {
    try {
      const result = await adminCall('/api/leave-status', {
        method: 'POST',
        body: { id, status: newStatus, comment },
      });
      if (!result) return;
      setLeaveRequests((prev) => prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, decisionComment: comment || null } : r
      ));
      showMessage(`Leave ${newStatus.toLowerCase()}`, 'success');
    } catch (err) {
      console.error('Leave status error:', err);
      showMessage('Failed to update leave status', 'error');
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
        setSubmissions((prev) => prev.map((s) =>
          s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s
        ));
      } else {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
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
      setSubmissions((prev) => prev.map((s) =>
        s.id === id ? { ...s, isDeleted: false, deletedAt: null } : s
      ));
      showMessage('Submission restored successfully', 'success');
    } catch (err) {
      console.error('Restore error:', err);
      showMessage('Failed to restore submission', 'error');
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchLeaveRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount = submissions.filter((s) => !s.isDeleted && s.status === 'Pending').length;
  const approvedCount = submissions.filter((s) => !s.isDeleted && s.status === 'Approved').length;
  const pendingLeave = leaveRequests.filter((r) => r.status === 'Pending').length;

  // Which tab matches the current URL (exact match for the index route).
  const activeTab = TAB_PATHS.indexOf(location.pathname) >= 0 ? TAB_PATHS.indexOf(location.pathname) : 0;

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
            { label: 'Total Submissions', value: submissions.filter((s) => !s.isDeleted).length, icon: <PeopleIcon />, color: '#f5a623' },
            { label: 'Pending Review', value: pendingCount, icon: <PendingIcon />, color: '#fbbf24' },
            { label: 'Approved', value: approvedCount, icon: <ApprovedIcon />, color: '#22d3a3' },
            { label: 'Leave Requests', value: pendingLeave, icon: <LeaveIcon />, color: '#818cf8' },
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
          <Tabs
            value={activeTab}
            onChange={(e, v) => navigate(TAB_PATHS[v])}
            sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab label={`Employee Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}`} />
            <Tab label={`Leave Approvals${pendingLeave > 0 ? ` (${pendingLeave})` : ''}`} />
            <Tab label="Timesheets" />
            <Tab label="Holidays" />
            <Tab label="Create Employee" />
            {userRole === 'superadmin' && <Tab label="Manage Admins" />}
          </Tabs>

          <Box sx={{ p: 3 }}>
            <Routes>
              <Route
                index
                element={
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
                      onViewDetails={setSelectedSubmission}
                      onDeleteSubmission={deleteSubmission}
                      onRestoreSubmission={restoreSubmission}
                      userRole={userRole}
                    />
                  </>
                }
              />
              <Route
                path="leaves"
                element={
                  <LeaveApprovals
                    leaveRequests={leaveRequests}
                    loading={loading}
                    onApproveLeave={(id, comment) => updateLeaveStatus(id, 'Approved', comment)}
                    onRejectLeave={(id, comment) => updateLeaveStatus(id, 'Rejected', comment)}
                  />
                }
              />
              <Route path="timesheets" element={<TimesheetReview />} />
              <Route path="holidays" element={<HolidayManager />} />
              <Route path="create-employee" element={<CreateEmployee />} />
              <Route
                path="manage-admins"
                element={userRole === 'superadmin' ? <ManageAdmins /> : <Navigate to="/admin" replace />}
              />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Box>
        </Paper>
      </Box>

      <ChangePassword open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

      <SubmissionDetailsDialog
        submission={selectedSubmission}
        fileUrls={fileUrls}
        onClose={() => setSelectedSubmission(null)}
        onUpdateStatus={updateStatus}
      />

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

export default AdminDashboard;
