import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Modal from './components/Modal';
import AIChatWidget from './components/AIChatWidget';

function App() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionMsg, setSessionMsg] = useState('');
  const location = useLocation();

  // Define paths where AIChatWidget should be hidden
  const authPaths = ['/login', '/register', '/reset-password', '/set-new-password'];
  const shouldHideChat = authPaths.includes(location.pathname);

  useEffect(() => {
    const handler = () => {
      setSessionMsg(localStorage.getItem('forceLogoutMsg') || 'Your session has expired. Please log in again.');
      setSessionExpired(true);
    };
    window.addEventListener('sessionExpired', handler);
    // Listen for manual token deletion (storage event)
    const storageHandler = () => {
      const access = localStorage.getItem('authToken');
      const refresh = localStorage.getItem('refreshToken');
      if (!access && !refresh) {
        setSessionMsg('Your session has expired. Please log in again.');
        setSessionExpired(true);
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sessionExpired', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  return (
    <>
      {sessionExpired && (
        <Modal
          isOpen={sessionExpired}
          onClose={() => {
            setSessionExpired(false);
            localStorage.removeItem('forceLogoutMsg');
          }}
          title="Session Expired"
          showConfirmButton={true}
          confirmButtonText="OK"
          onConfirm={() => {
            setSessionExpired(false);
            localStorage.removeItem('forceLogoutMsg');
          }}
          showCancelButton={false}
        >
          <p>{sessionMsg}</p>
        </Modal>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/applications" element={<Layout><ApplicationManagement /></Layout>} />
        <Route path="/modules" element={<Layout><ModuleManagement /></Layout>} />
        <Route path="/scan-config" element={<Layout><ScanConfig /></Layout>} />
        <Route path="/flow-analyzer" element={<Layout><FlowAnalyzer /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/user-profile" element={<Layout><UserProfile /></Layout>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      {!shouldHideChat && <AIChatWidget />}
    </>
  );
}
export default App;