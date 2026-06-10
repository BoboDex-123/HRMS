import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Typography, Chip, CircularProgress, TextField, TablePagination,
} from '@mui/material';
import { AccessTime as ClockIcon } from '@mui/icons-material';
import { apiFetch } from '../../api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Admin read-only view of all employee timesheet entries.
const TimesheetReview = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setEntries(await apiFetch('/api/timesheets', { auth: 'admin' }));
      } catch (err) {
        console.error('Timesheet fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => { setPage(0); }, [filter]);

  const filtered = entries.filter((e) =>
    !filter ||
    e.email?.toLowerCase().includes(filter) ||
    e.project?.toLowerCase().includes(filter)
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <ClockIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">No timesheet entries yet</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          Hours logged by employees will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TextField
        label="Filter by email or project"
        variant="outlined"
        fullWidth
        size="small"
        sx={{ mb: 3 }}
        value={filter}
        onChange={(e) => setFilter(e.target.value.toLowerCase())}
      />
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((entry) => (
              <TableRow key={entry.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{entry.email}</TableCell>
                <TableCell>{formatDate(entry.workDate)}</TableCell>
                <TableCell>
                  <Chip label={`${entry.hours} h`} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{entry.project || '—'}</TableCell>
                <TableCell sx={{ maxWidth: 280, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {entry.description || '—'}
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
    </>
  );
};

export default TimesheetReview;
