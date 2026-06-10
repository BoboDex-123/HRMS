import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Box, Typography, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton, Tooltip, TablePagination
} from '@mui/material';
import { Delete as DeleteIcon, Restore as RestoreIcon, PeopleAlt as PeopleIcon } from '@mui/icons-material';

const statusChip = (submission) => {
  if (submission.isDeleted) return <Chip label="Deleted" size="small" color="default" />;
  if (submission.status === 'Approved') return <Chip label="Approved" size="small" color="success" />;
  if (submission.status === 'Rejected') return <Chip label="Rejected" size="small" color="error" />;
  return <Chip label="Pending" size="small" color="warning" />;
};

const EmployeeApprovals = ({
  submissions, searchTerm, loading, onViewDetails,
  onDeleteSubmission, onRestoreSubmission, userRole
}) => {
  const isSuperAdmin = userRole === 'superadmin';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // A new search should always start from the first page of results.
  useEffect(() => { setPage(0); }, [searchTerm]);

  const handleDeleteClick = (submission) => {
    setSubmissionToDelete(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (submissionToDelete) onDeleteSubmission(submissionToDelete.id);
    setDeleteDialogOpen(false);
    setSubmissionToDelete(null);
  };

  const filtered = (submissions || []).filter((s) => {
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const email = s.email?.toLowerCase() || '';
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (filtered.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <PeopleIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {searchTerm ? 'No results match your search' : 'No onboarding submissions yet'}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          {searchTerm
            ? 'Try a different name or email.'
            : 'New employee onboarding submissions will appear here.'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => (
              <TableRow
                key={s.id}
                hover
                sx={{ opacity: s.isDeleted ? 0.6 : 1, backgroundColor: s.isDeleted ? 'rgba(248,113,113,0.06)' : 'inherit' }}
              >
                <TableCell sx={{ fontWeight: 500 }}>
                  {s.firstName} {s.lastName}
                  {s.isDeleted && (
                    <Chip label="Deleted" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                  )}
                </TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>
                  {new Date(s.submittedAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </TableCell>
                <TableCell>{statusChip(s)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button size="small" variant="outlined" onClick={() => onViewDetails(s)}>
                      View
                    </Button>
                    {s.isDeleted ? (
                      isSuperAdmin && (
                        <Tooltip title="Restore submission">
                          <IconButton color="success" onClick={() => onRestoreSubmission(s.id)} size="small">
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    ) : (
                      <Tooltip title="Delete submission">
                        <IconButton color="error" onClick={() => handleDeleteClick(s)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete the submission for{' '}
            <strong>{submissionToDelete?.firstName} {submissionToDelete?.lastName}</strong>?
            The data is retained and can be restored by a super admin.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeeApprovals;
