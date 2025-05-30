import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ApplicationManagement from './pages/ApplicationManagement';
import ModuleManagement from './pages/ModuleManagement';
import ScanConfig from './pages/ScanConfig';
import FlowAnalyzer from './pages/FlowAnalyzer';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import SetNewPassword from './pages/SetNewPassword';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-new-password" element={<SetNewPassword />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/applications" element={<ApplicationManagement />} />
              <Route path="/modules" element={<ModuleManagement />} />
              <Route path="/scan-config" element={<ScanConfig />} />
              <Route path="/flow-analyzer" element={<FlowAnalyzer />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/user-profile" element={<UserProfile />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
export default App;