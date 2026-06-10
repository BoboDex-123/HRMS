import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Typography, CircularProgress, TextField, Button,
  IconButton, Tooltip, Snackbar, Alert, TablePagination, Chip,
} from '@mui/material';
import { Celebration as HolidayIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { apiFetch } from '../../api';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

// Admin CRUD for the company holiday calendar. Holidays are excluded from
// leave-day counting and shown to employees in the portal.
const HolidayManager = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: '', name: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const fetchHolidays = useCallback(async () => {
    try {
      setHolidays(await apiFetch('/api/holidays', { auth: 'admin' }));
    } catch (err) {
      console.error('Holiday fetch error:', err);
      showMessage('Failed to load holidays', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/holidays', { method: 'POST', auth: 'admin', body: form });
      showMessage('Holiday added');
      setForm({ date: '', name: '' });
      fetchHolidays();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/holidays/${id}`, { method: 'DELETE', auth: 'admin' });
      showMessage('Holiday removed');
      fetchHolidays();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const isPast = (dateStr) => new Date(dateStr) < new Date(new Date().toDateString());

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Add holiday</Typography>
        <form onSubmit={handleAdd}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Date"
              type="date"
              size="small"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
            />
            <TextField
              label="Holiday name"
              size="small"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Diwali"
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button type="submit" variant="contained" disabled={saving || !form.date || !form.name.trim()}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Add'}
            </Button>
          </Box>
        </form>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && holidays.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <HolidayIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No holidays yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Holidays added here are excluded from employee leave-day counts.
          </Typography>
        </Box>
      )}

      {!loading && holidays.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Holiday</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((h) => (
                <TableRow key={h.id} hover sx={{ opacity: isPast(h.date) ? 0.55 : 1 }}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {formatDate(h.date)}
                    {isPast(h.date) && <Chip label="Past" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                  </TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete holiday">
                      <IconButton size="small" color="error" onClick={() => handleDelete(h.id)}>
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
            count={holidays.length}
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
    </>
  );
};

export default HolidayManager;
