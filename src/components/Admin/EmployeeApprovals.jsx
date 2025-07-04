import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Box
} from '@mui/material';

const EmployeeApprovals = ({ submissions, searchTerm, onViewDetails }) => {
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
            <TableRow key={submission.id}>
              <TableCell>{submission.id.substring(0, 8)}...</TableCell>
              <TableCell>{submission.firstName}{submission.lastName}</TableCell>
              <TableCell>{submission.email}</TableCell>
              <TableCell>{new Date(submission.submissionDate).toLocaleString()}</TableCell>
              <TableCell>
                <Box sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor:
                    submission.status === 'Approved' ? '#4caf50' :
                    submission.status === 'Rejected' ? '#f44336' : '#ff9800',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  {submission.status}
                </Box>
              </TableCell>
              <TableCell>
                <Button variant="outlined" onClick={() => onViewDetails(submission)}>
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EmployeeApprovals;
