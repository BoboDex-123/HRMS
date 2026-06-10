import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Employee Login', sub: 'Access your portal & documents', path: '/employee-login', primary: true },
    { label: 'Admin Login', sub: 'HR management console', path: '/admin-login' },
    { label: 'New Employee', sub: 'Start your onboarding process', path: '/employee/onboarding' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0d12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none',
      }} />

      {/* Amber glow */}
      <div style={{
        position: 'absolute',
        width: '60vw', height: '60vw',
        maxWidth: 700, maxHeight: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)',
        top: '-25%', left: '-15%',
        pointerEvents: 'none',
      }} />

      {/* Indigo glow */}
      <div style={{
        position: 'absolute',
        width: '40vw', height: '40vw',
        maxWidth: 500, maxHeight: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
        bottom: '-15%', right: '-5%',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          maxWidth: 820, width: '100%',
          background: 'rgba(18, 21, 30, 0.82)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
        }}
      >
        {/* Left: brand */}
        <div
          className="login-brand-panel"
          style={{
            padding: '52px 44px',
            background: 'linear-gradient(160deg, rgba(245,166,35,0.04) 0%, transparent 50%)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
              <div style={{
                width: 30, height: 30,
                background: '#f5a623',
                borderRadius: 6,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>Internal Portal</span>
            </div>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(64px, 9vw, 88px)',
              fontWeight: 700,
              color: '#dde1ed',
              lineHeight: 0.88,
              margin: '0 0 28px',
              letterSpacing: '-3px',
            }}>
              HRMS
            </h1>

            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14, fontWeight: 400,
              color: '#6b7394',
              lineHeight: 1.65,
              margin: 0, maxWidth: 210,
            }}>
              Employee onboarding & human resource management system.
            </p>
          </div>

          <div>
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, rgba(245,166,35,0.28) 0%, transparent 80%)',
              marginBottom: 18,
            }} />
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11,
              color: '#3d4257',
              margin: 0,
              letterSpacing: '0.03em',
            }}>
              Secure · Internal · Authorized Personnel Only
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 36, fontWeight: 600,
              color: '#dde1ed',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
            }}>Welcome back.</h2>
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13, color: '#6b7394',
              margin: '0 0 32px',
            }}>Select your access level to continue.</p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map(({ label, sub, path, primary }, i) => (
              <motion.div
                key={path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.07, duration: 0.4 }}
              >
                <ActionRow label={label} sub={sub} primary={primary} onClick={() => navigate(path)} />
              </motion.div>
            ))}
          </div>

          <p style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 11,
            color: '#3d4257',
            margin: '28px 0 0',
            letterSpacing: '0.02em',
          }}>
            Internal use only — unauthorized access is prohibited.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const ActionRow = ({ label, sub, primary, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '15px 18px',
        background: primary
          ? hovered ? 'rgba(245,166,35,0.14)' : 'rgba(245,166,35,0.07)'
          : hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        border: primary
          ? `1px solid rgba(245,166,35,${hovered ? '0.38' : '0.18'})`
          : `1px solid rgba(255,255,255,${hovered ? '0.1' : '0.05'})`,
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.16s ease',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <div>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13.5, fontWeight: 600,
          color: primary ? '#f5a623' : '#dde1ed',
          marginBottom: 2,
        }}>{label}</div>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12, color: '#6b7394',
        }}>{sub}</div>
      </div>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{
        flexShrink: 0,
        transition: 'opacity 0.16s ease, transform 0.16s ease',
        opacity: hovered ? 0.85 : 0.28,
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
      }}>
        <path d="M6 4L10 8L6 12" stroke={primary ? '#f5a623' : '#dde1ed'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default Login;
