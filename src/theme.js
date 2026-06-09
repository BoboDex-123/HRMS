import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f5a623',
      light: '#ffc857',
      dark: '#cc8914',
      contrastText: '#0b0d12',
    },
    secondary: {
      main: '#818cf8',
      light: '#a5b4fc',
      dark: '#6366f1',
      contrastText: '#ffffff',
    },
    success: {
      main: '#22d3a3',
      light: '#34d399',
      dark: '#10b981',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
    },
    warning: {
      main: '#fbbf24',
      light: '#fde68a',
      dark: '#f59e0b',
    },
    background: {
      default: '#0b0d12',
      paper: '#141720',
    },
    text: {
      primary: '#dde1ed',
      secondary: '#6b7394',
      disabled: '#3d4257',
    },
    divider: 'rgba(255,255,255,0.07)',
    action: {
      hover: 'rgba(255,255,255,0.04)',
      selected: 'rgba(245,166,35,0.12)',
      focus: 'rgba(245,166,35,0.08)',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 0 0 1px rgba(245,166,35,0.3), 0 4px 16px rgba(245,166,35,0.15)',
          },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.12)',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.25)',
            backgroundColor: 'rgba(255,255,255,0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
        elevation1: { boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)' },
        elevation3: { boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
        elevation6: { boxShadow: '0 10px 30px rgba(0,0,0,0.6)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0e1019',
          backgroundImage: 'none',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0e1019',
          backgroundImage: 'none',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#1a1e2e',
          color: '#6b7394',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
            '&.Mui-focused fieldset': { borderColor: '#f5a623' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#f5a623' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          color: '#6b7394',
          '&.Mui-selected': { color: '#f5a623' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#f5a623' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, backgroundImage: 'none' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(245,166,35,0.12)',
            color: '#f5a623',
            '& .MuiListItemIcon-root': { color: '#f5a623' },
            '&:hover': { backgroundColor: 'rgba(245,166,35,0.18)' },
          },
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {},
      },
    },
  },
});

export default theme;
