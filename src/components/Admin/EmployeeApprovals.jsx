import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Box,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton, Tooltip
} from '@mui/material';
import { Delete as DeleteIcon, Restore as RestoreIcon } from '@mui/icons-material';

const EmployeeApprovals = ({ submissions, searchTerm, onViewDetails, onDeleteSubmission, userRole, onRestoreSubmission }) => {
  const isSuperAdmin = userRole === 'superadmin';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState(null);

  const handleDeleteClick = (submission) => {
    setSubmissionToDelete(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (submissionToDelete && onDeleteSubmission) {
      onDeleteSubmission(submissionToDelete.id);
    }
    setDeleteDialogOpen(false);
    setSubmissionToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSubmissionToDelete(null);
  };
  const filteredSubmissions = submissions.filter((submission) => {
    const fullName = `${submission.firstName || ''} ${submission.lastName || ''}`.toLowerCase();
    const email = submission.email?.toLowerCase() || '';
    return (
      fullName.includes(searchTerm) || email.includes(searchTerm)
    );
  });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Submission Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredSubmissions.map((submission) => (
            <TableRow
              key={submission.id}
              sx={{
                opacity: submission.isDeleted ? 0.6 : 1,
                backgroundColor: submission.isDeleted ? '#ffebee' : 'inherit'
              }}
            >
              <TableCell>{submission.id.substring(0, 8)}...</TableCell>
              <TableCell>
                {submission.firstName} {submission.lastName}
                {submission.isDeleted && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      backgroundColor: '#9e9e9e',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}
                  >
                    DELETED
                  </Box>
                )}
              </TableCell>
              <TableCell>{submission.email}</TableCell>
              <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
              <TableCell>
                <Box sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor:
                    submission.isDeleted ? '#9e9e9e' :
                    submission.status === 'Approved' ? '#4caf50' :
                    submission.status === 'Rejected' ? '#f44336' : '#ff9800',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  {submission.isDeleted ? 'Deleted' : submission.status}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => onViewDetails(submission)}>
                    View Details
                  </Button>
                  {submission.isDeleted ? (
                    isSuperAdmin && onRestoreSubmission && (
                      <Tooltip title="Restore submission">
                        <IconButton
                          color="success"
                          onClick={() => onRestoreSubmission(submission.id)}
                          size="small"
                        >
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  ) : (
                    <Tooltip title="Delete submission">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(submission)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the submission for{' '}
            <strong>{submissionToDelete?.firstName} {submissionToDelete?.lastName}</strong>?
            <br /><br />
            This will remove it from your view, but the data will be retained in the system for super admin access.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

export default EmployeeApprovals;
