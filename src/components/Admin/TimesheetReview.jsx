import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Typography, Chip, CircularProgress, TextField, TablePagination,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { AccessTime as ClockIcon } from '@mui/icons-material';
import { apiFetch } from '../../api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// "9 – 15 Jun" for a Monday week-start date.
const formatWeek = (weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts = { day: '2-digit', month: 'short' };
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
};

// Admin read-only view of all employee timesheet entries.
const TimesheetReview = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [view, setView] = useState('entries');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [entryData, summaryData] = await Promise.all([
          apiFetch('/api/timesheets', { auth: 'admin' }),
          apiFetch('/api/timesheets/summary', { auth: 'admin' }),
        ]);
        setEntries(entryData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Timesheet fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => { setPage(0); }, [filter, view]);

  const filtered = entries.filter((e) =>
    !filter ||
    e.email?.toLowerCase().includes(filter) ||
    e.project?.toLowerCase().includes(filter)
  );

  const filteredSummary = summary.filter((s) => !filter || s.email?.toLowerCase().includes(filter));

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

  const rows = view === 'entries' ? filtered : filteredSummary;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(e, v) => v && setView(v)}
        >
          <ToggleButton value="entries">Entries</ToggleButton>
          <ToggleButton value="summary">Weekly Summary</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          label={view === 'entries' ? 'Filter by email or project' : 'Filter by email'}
          variant="outlined"
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
        />
      </Box>

      <TableContainer component={Paper} variant="outlined">
        {view === 'entries' ? (
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
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Week</TableCell>
                <TableCell>Entries</TableCell>
                <TableCell>Total Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSummary.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => (
                <TableRow key={`${s.email}-${s.weekStart}`} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{s.email}</TableCell>
                  <TableCell>{formatWeek(s.weekStart)}</TableCell>
                  <TableCell>{s.entries}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${s.totalHours} h`}
                      size="small"
                      color={s.totalHours < 40 ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <TablePagination
          component="div"
          count={rows.length}
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
