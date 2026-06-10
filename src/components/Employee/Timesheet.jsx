import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, TextField, Button, Grid,
  IconButton, Tooltip, Snackbar, Alert, TablePagination,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiFetch } from '../../api';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const Timesheet = () => {
  const [entries, setEntries] = useState([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    workDate: todayISO(),
    hours: '',
    project: '',
    description: '',
  });

  const showMessage = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const fetchEntries = useCallback(async () => {
    try {
      const data = await apiFetch('/api/employee/timesheets', { auth: 'employee' });
      setEntries(data.entries);
      setWeekTotal(data.weekTotal);
    } catch (err) {
      console.error('Timesheet fetch error:', err);
      showMessage('Failed to load timesheet', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/employee/timesheets', {
        method: 'POST',
        auth: 'employee',
        body: {
          workDate: form.workDate,
          hours: Number(form.hours),
          project: form.project,
          description: form.description,
        },
      });
      showMessage('Hours logged');
      setForm({ workDate: form.workDate, hours: '', project: form.project, description: '' });
      fetchEntries();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/employee/timesheets/${id}`, { method: 'DELETE', auth: 'employee' });
      showMessage('Entry removed');
      fetchEntries();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Timesheet</Typography>
        <Chip
          icon={<ClockIcon />}
          label={`${weekTotal} hrs this week`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Entry form */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Log hours</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                size="small"
                required
                value={form.workDate}
                onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: todayISO() }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                label="Hours"
                type="number"
                fullWidth
                size="small"
                required
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                inputProps={{ min: 0.5, max: 24, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                label="Project"
                fullWidth
                size="small"
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                placeholder="e.g. Website Redesign"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                label="What did you work on?"
                fullWidth
                size="small"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={saving || !form.hours}
                sx={{ height: 40 }}
              >
                {saving ? <CircularProgress size={20} color="inherit" /> : 'Log Hours'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* History */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && entries.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ClockIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No hours logged yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Use the form above to log your first entry.
          </Typography>
        </Box>
      )}

      {!loading && entries.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{formatDate(entry.workDate)}</TableCell>
                  <TableCell>
                    <Chip label={`${entry.hours} h`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{entry.project || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 280, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {entry.description || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete entry">
                      <IconButton size="small" color="error" onClick={() => handleDelete(entry.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={entries.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </TableContainer>
      )}

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

export default Timesheet;
