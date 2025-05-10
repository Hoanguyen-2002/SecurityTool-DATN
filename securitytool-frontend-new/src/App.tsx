import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ApplicationManagement from './pages/ApplicationManagement';
import ModuleManagement from './pages/ModuleManagement';
import ScanConfig from './pages/ScanConfig';
import FlowAnalyzer from './pages/FlowAnalyzer';
import Reports from './pages/Reports';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications" element={<ApplicationManagement />} />
        <Route path="/modules" element={<ModuleManagement />} />
        <Route path="/scan-config" element={<ScanConfig />} />
        <Route path="/flow-analyzer" element={<FlowAnalyzer />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}
export default App;