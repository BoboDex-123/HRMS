import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Box, Typography, Chip
} from '@mui/material';
import { EventNote as LeaveIcon } from '@mui/icons-material';

const statusColor = (status) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'error';
  return 'warning';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const LeaveApprovals = ({ leaveRequests, loading, onApproveLeave, onRejectLeave }) => {
  if (!loading && (!leaveRequests || leaveRequests.length === 0)) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <LeaveIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">No leave requests yet</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          Leave applications submitted by employees will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Leave Type</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaveRequests.map((request) => (
            <TableRow key={request.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{request.name || '—'}</TableCell>
              <TableCell>{request.email}</TableCell>
              <TableCell>
                <Chip label={request.leaveType || request.leave_type || '—'} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{formatDate(request.from)}</TableCell>
              <TableCell>{formatDate(request.to)}</TableCell>
              <TableCell sx={{ maxWidth: 180, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {request.reason || '—'}
              </TableCell>
              <TableCell>
                <Chip
                  label={request.status}
                  size="small"
                  color={statusColor(request.status)}
                />
              </TableCell>
              <TableCell>
                {request.status === 'Pending' ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => onApproveLeave(request.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onRejectLeave(request.id)}
                    >
                      Reject
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled">—</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeaveApprovals;
