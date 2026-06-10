import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Box, Typography, Chip, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // { request, action: 'Approved' | 'Rejected' } while the note dialog is open
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');

  const openDecision = (request, action) => {
    setDecision({ request, action });
    setComment('');
  };

  const confirmDecision = () => {
    if (!decision) return;
    if (decision.action === 'Approved') onApproveLeave(decision.request.id, comment);
    else onRejectLeave(decision.request.id, comment);
    setDecision(null);
  };

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
          {leaveRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((request) => (
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
                {request.decisionComment && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, maxWidth: 180 }}>
                    Note: {request.decisionComment}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {request.status === 'Pending' ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => openDecision(request, 'Approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => openDecision(request, 'Rejected')}
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
      <TablePagination
        component="div"
        count={leaveRequests.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50]}
      />

      <Dialog open={Boolean(decision)} onClose={() => setDecision(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {decision?.action === 'Approved' ? 'Approve' : 'Reject'} leave for {decision?.request?.name || decision?.request?.email}?
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Note to employee (optional)"
            placeholder={decision?.action === 'Rejected' ? 'e.g. Overlaps with the release window' : 'e.g. Enjoy your time off'}
            fullWidth
            multiline
            rows={2}
            margin="dense"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecision(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={decision?.action === 'Approved' ? 'success' : 'error'}
            onClick={confirmDecision}
          >
            {decision?.action === 'Approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

export default LeaveApprovals;
