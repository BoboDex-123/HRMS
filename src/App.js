import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import { Amplify } from 'aws-amplify';
import AdminPortal from './components/Admin/AdminPortal';
import OnboardingForm from './components/Employee/OnboardingForm';
import { RequireAuth } from './components/Employee/RequireAuth';
import EmployeeAuthLogin from './components/Employee/EmployeeAuthLogin';
import EmployeePortal from './components/Employee/EmployeePortal'; 

import awsExports from './aws-exports';
import './amplify-config';

//Amplify.configure(awsExports);

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

        <Route path="/admin-login" element={<AdminPortal />} />
        <Route path="/employee/onboarding" element={<OnboardingForm />} />
      </Routes>

    </Router>
  );
}

export default App;
