import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import Modal from '../components/Modal';
import { changePassword } from '../api/userApi';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [changePwdForm, setChangePwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [changePwdError, setChangePwdError] = useState('');
  const [changePwdSuccess, setChangePwdSuccess] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showChangeCurrentPassword, setShowChangeCurrentPassword] = useState(false);
  const [showChangeNewPassword, setShowChangeNewPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMustChangePassword(false);
    try {
      const response = await login(username, password);
      // Save token to localStorage or context
      localStorage.setItem('authToken', response.data.token);
      if (response.data.mustChangePassword) {
        setMustChangePassword(true);
        setShowChangePwdModal(true);
        setChangePwdForm({ currentPassword: password, newPassword: '' });
        return;
      }
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (err: any) {
      // Handle error as string (exception) from backend
      const msg = err.response?.data || 'Login failed';
      setError(msg);
    }
  };

  const handleChangePwdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChangePwdForm({ ...changePwdForm, [e.target.name]: e.target.value });
  };

  const handleChangePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwdError('');
    setChangePwdSuccess('');
    try {
      await changePassword({
        currentPassword: changePwdForm.currentPassword,
        newPassword: changePwdForm.newPassword,
      });
      setChangePwdSuccess('Password changed successfully! Please login again.');
      // Do not close modal or reload immediately
    } catch (err: any) {
      setChangePwdError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700">Security Tool</h2>
        <p className="text-gray-600 text-center mb-6 text-base">
          Welcome to Security Tool! Effortlessly manage, scan, and analyze your E-commerce applications for vulnerabilities. Stay secure with real-time dashboards, detailed reports, and powerful automation features.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          {error && <div className="mb-4 text-red-500">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="mb-6 relative">
            <label className="block mb-1 font-medium">Password</label>
            <input
              type={showLoginPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3"
              style={{ top: '70%', transform: 'translateY(-50%)' }}
              onClick={() => setShowLoginPassword(v => !v)}
              aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
            >
              {showLoginPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold shadow">Login</button>
        </form>
        <div className="mt-4 text-center">
          <a href="/register" className="text-blue-600 hover:underline">Don't have an account? Register</a>
        </div>
        <div className="mt-2 text-center">
          <a href="/reset-password" className="text-blue-600 hover:underline">Forgot password?</a>
        </div>
      </div>
      <Modal isOpen={showChangePwdModal} onClose={() => setShowChangePwdModal(false)} title="Change Password" showFooterActions={false}>
        {changePwdSuccess ? (
          <div className="space-y-4 text-center">
            <div className="text-green-600 text-lg font-semibold">{changePwdSuccess}</div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => {
                setShowChangePwdModal(false);
                setChangePwdSuccess('');
                setChangePwdForm({ currentPassword: '', newPassword: '' });
                setUsername('');
                setPassword('');
              }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePwdSubmit} className="space-y-4">
            {changePwdError && <div className="text-red-500">{changePwdError}</div>}
            <div className="relative">
              <label className="block mb-1">Current Password</label>
              <input
                type={showChangeCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={changePwdForm.currentPassword}
                onChange={handleChangePwdInput}
                required
                className="w-full px-3 py-2 border rounded pr-10"
                readOnly
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3"
                style={{ top: '70%', transform: 'translateY(-50%)' }}
                onClick={() => setShowChangeCurrentPassword(v => !v)}
                aria-label={showChangeCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showChangeCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative">
              <label className="block mb-1">New Password</label>
              <input
                type={showChangeNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={changePwdForm.newPassword}
                onChange={handleChangePwdInput}
                required
                className="w-full px-3 py-2 border rounded pr-10"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3"
                style={{ top: '70%', transform: 'translateY(-50%)' }}
                onClick={() => setShowChangeNewPassword(v => !v)}
                aria-label={showChangeNewPassword ? 'Hide password' : 'Show password'}
              >
                {showChangeNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowChangePwdModal(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Change Password</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Login;
