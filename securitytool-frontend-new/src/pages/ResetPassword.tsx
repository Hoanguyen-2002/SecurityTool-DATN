import React, { useState } from 'react';
import { resetPassword } from '../api/authApi';
import Modal from '../components/Modal';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWaitModal, setShowWaitModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setShowWaitModal(true);
    try {
      await resetPassword(email);
      setShowWaitModal(false);
      setMessage('If your email exists, a reset link has been sent. Please check your inbox.');
    } catch (err: any) {
      setShowWaitModal(false);
      setError(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700">Reset Password</h2>
        <p className="text-gray-600 text-center mb-6 text-base">
          Enter your email address and we'll send you a link to reset your password. Keep your account secure with Security Tool.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {message && <div className="mb-4 text-green-600">{message}</div>}
          <div className="mb-6">
            <label className="block mb-1 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold shadow">Send Reset Link</button>
        </form>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
        </div>
      </div>
      <Modal isOpen={showWaitModal} onClose={() => {}} title="Please Wait" showFooterActions={false}>
        <div className="mb-4 text-center text-base">Sending reset password link to your email. please wait</div>
      </Modal>
    </div>
  );
};

export default ResetPassword;
