import React from 'react';
import {
  Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Chip, Divider,
} from '@mui/material';

// Read-only detail view of an onboarding submission, with Approve/Reject
// actions while the submission is still pending.
const SubmissionDetailsDialog = ({ submission, fileUrls, onClose, onUpdateStatus }) => (
  <Dialog open={Boolean(submission)} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          {submission?.firstName} {submission?.lastName}
        </Typography>
        {submission && (
          <Chip
            label={submission.status}
            size="small"
            color={
              submission.status === 'Approved' ? 'success' :
              submission.status === 'Rejected' ? 'error' : 'warning'
            }
          />
        )}
      </Box>
    </DialogTitle>
    <DialogContent dividers>
      {submission && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Email', value: submission.email },
              { label: 'Phone', value: submission.phone },
              { label: 'Date of Birth', value: submission.dob || '—' },
              { label: 'PAN Number', value: submission.panNumber || '—' },
              { label: 'Address', value: submission.address || '—', full: true },
            ].map(({ label, value, full }) => (
              <Grid item xs={12} sm={full ? 12 : 6} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{value}</Typography>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Education
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'School', value: submission.schoolName || '—' },
              { label: 'College', value: submission.collegeName || '—' },
              { label: 'University (PG)', value: submission.universityName || '—' },
            ].map(({ label, value }) => (
              <Grid item xs={12} sm={4} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{value}</Typography>
              </Grid>
            ))}
          </Grid>

          {submission.files?.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Documents ({submission.files.length})
              </Typography>
              <Grid container spacing={2}>
                {submission.files.map((file) => (
                  <Grid item xs={12} sm={6} key={file.key}>
                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {file.field} — {file.key.split('/').pop()}
                      </Typography>
                      <a href={fileUrls[file.key]} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button size="small" variant="outlined">Download</Button>
                      </a>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      )}
    </DialogContent>
    {submission && submission.status === 'Pending' && (
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" color="success" onClick={() => onUpdateStatus(submission.id, 'Approved')}>
          Approve
        </Button>
        <Button variant="outlined" color="error" onClick={() => onUpdateStatus(submission.id, 'Rejected')}>
          Reject
        </Button>
      </DialogActions>
    )}
  </Dialog>
);

export default SubmissionDetailsDialog;
