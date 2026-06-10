import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  TablePagination,
} from '@mui/material';
import { EventNote as LeaveIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiFetch } from '../../api';

const statusColor = (status) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'error';
  return 'warning';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLeaves(await apiFetch('/api/employee/leave-requests', { auth: 'employee' }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        My Leave Requests
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>{error}</Typography>
      )}

      {!loading && !error && leaves.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <LeaveIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No leave requests yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Requests you submit will appear here with their approval status.
          </Typography>
        </Box>
      )}

      {!loading && !error && leaves.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Leave Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((leave) => (
                <TableRow key={leave.id} hover>
                  <TableCell>
                    <Chip label={leave.leaveType || '—'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{formatDate(leave.from)}</TableCell>
                  <TableCell>{formatDate(leave.to)}</TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {leave.reason || '—'}
                  </TableCell>
                  <TableCell>{formatDate(leave.submittedAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={leave.status}
                      size="small"
                      color={statusColor(leave.status)}
                    />
                    {leave.decisionComment && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, maxWidth: 200 }}>
                        Note: {leave.decisionComment}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={leaves.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default MyLeaves;
