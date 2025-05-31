import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import Modal from '../components/Modal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const majors = [
  'Software Engineer',
  'Data Engineer',
  'Security Analyst',
];

const Register: React.FC = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    major: majors[0],
    companyName: '',
  });
  const [customMajor, setCustomMajor] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'major') {
      setForm({ ...form, major: e.target.value });
      if (e.target.value === 'Enter Manually') setCustomMajor('');
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowWaitModal(true);
    let submitForm = { ...form };
    if (form.major === 'Enter Manually') {
      submitForm.major = customMajor;
    }
    try {
      await register(submitForm);
      setShowWaitModal(false);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setShowWaitModal(false);
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700">Register</h2>
        <p className="text-gray-600 text-center mb-6 text-base">
          Create your account to access Security Tool. Manage, scan, and analyze your applications securely and efficiently.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {success && <div className="mb-4 text-green-600">{success}</div>}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Username</label>
            <input name="username" value={form.username} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="mb-4 relative">
            <label className="block mb-1 font-medium">Password</label>
            <input
              type={showRegisterPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3"
              style={{ top: '70%', transform: 'translateY(-50%)' }}
              onClick={() => setShowRegisterPassword(v => !v)}
              aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
            >
              {showRegisterPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Enter your email" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Enter your phone number" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Company Name</label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your company name"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium">Major</label>
            <select name="major" value={majors.includes(form.major) ? form.major : 'Enter Manually'} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200">
              {majors.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="Enter Manually">Enter Manually...</option>
            </select>
            {(!majors.includes(form.major) || form.major === 'Enter Manually') && (
              <input
                className="w-full px-3 py-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Enter your major"
                value={customMajor}
                onChange={e => setCustomMajor(e.target.value)}
                required
              />
            )}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold shadow">Register</button>
        </form>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">Already have an account? Login</a>
        </div>
      </div>
      <Modal isOpen={showWaitModal} onClose={() => {}} title="Please Wait" showFooterActions={false}>
        <div className="mb-4 text-center text-base">Sending verification link to your email, please wait...</div>
      </Modal>
    </div>
  );
};

export default Register;
