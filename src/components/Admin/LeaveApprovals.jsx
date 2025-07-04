import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button
} from '@mui/material';

const LeaveApprovals = ({ leaveRequests, onApproveLeave, onRejectLeave }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaveRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.id.substring(0, 8)}...</TableCell>
              <TableCell>{request.name}</TableCell>
              <TableCell>{request.email}</TableCell>
              <TableCell>{request.from}</TableCell>
              <TableCell>{request.to}</TableCell>
              <TableCell>{request.reason}</TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell>
                <Button onClick={() => onApproveLeave(request.id)} color="success">Approve</Button>
                <Button onClick={() => onRejectLeave(request.id)} color="error">Reject</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeaveApprovals;
