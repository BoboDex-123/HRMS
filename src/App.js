import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import OnboardingForm from './components/Employee/OnboardingForm';
import { RequireAuth } from './components/Employee/RequireAuth';
import EmployeeAuthLogin from './components/Employee/EmployeeAuthLogin';
import EmployeePortal from './components/Employee/EmployeePortal';

// Admin routes are guarded by the presence of a session token; the API client
// logs out and redirects on 401 if the token has expired server-side.
const RequireAdminAuth = ({ children }) =>
  sessionStorage.getItem('adminToken') ? children : <Navigate to="/admin-login" replace />;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/employee-login" element={<EmployeeAuthLogin />} />
        <Route path="/employee-portal/*" element={
          <RequireAuth>
            <EmployeePortal />
          </RequireAuth>
        } />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <RequireAdminAuth>
            <AdminDashboard />
          </RequireAdminAuth>
        } />
        <Route path="/employee/onboarding" element={<OnboardingForm />} />
      </Routes>

    </Router>
  );
}

export default App;
