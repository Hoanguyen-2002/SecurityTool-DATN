import React, { useEffect, useState, useRef } from 'react';
import { editUserInfo, getUserInfo } from '../api/userApi';
import Modal from '../components/Modal';
import { PencilSquareIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const majors = [
  'Software Engineer',
  'Data Engineer',
  'Security Analyst',
];

const UserProfile: React.FC = () => {
  const [user, setUser] = useState({
    username: '',
    email: '',
    phone: '',
    major: majors[0],
    companyName: '',
    updatedAt: '',
  });
  const [editForm, setEditForm] = useState(user);
  const [modalOpen, setModalOpen] = useState(false);  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');  const [emailError, setEmailError] = useState(''); // Add specific email error state
  const [phoneError, setPhoneError] = useState(''); // Add specific phone error state
  const [loading, setLoading] = useState(true);
  const [customMajor, setCustomMajor] = useState(editForm.major && !majors.includes(editForm.major) ? editForm.major : '');
  const [changePwdModalOpen, setChangePwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const prevUsername = useRef(user.username);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await getUserInfo();
        setUser(res.data);
        setEditForm(res.data);
        prevUsername.current = res.data.username;
      } catch (err: any) {
        setError('Failed to load user info');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    // Remove setInterval and window focus event to avoid excessive API calls
    // Only fetch on mount and after update
  }, []);
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'major') {
      setEditForm({ ...editForm, major: e.target.value });
      if (e.target.value === 'Enter Manually') {
        setCustomMajor('');
      }
    } else {
      setEditForm({ ...editForm, [e.target.name]: e.target.value });      // Clear specific field errors when user starts typing
      if (e.target.name === 'email') {
        setEmailError('');
        setError('');
      } else if (e.target.name === 'phone') {
        setPhoneError('');
        setError('');
      }
    }
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();    setError('');
    setSuccess('');
    setEmailError(''); // Clear previous email errors
    setPhoneError(''); // Clear previous phone errors
    let submitForm = { ...editForm };
    if (editForm.major === 'Enter Manually') {
      submitForm.major = customMajor;
    }
    try {
      await editUserInfo(submitForm);
      // Refetch user info after successful update
      const res = await getUserInfo();
      setUser(res.data);
      setEditForm(res.data);
      setSuccess('Information updated successfully!');
      setModalOpen(false);
      prevUsername.current = submitForm.username;
    } catch (err: any) {
      console.log('Full error object:', err);
      console.log('Error response:', err?.response);
      console.log('Error response data:', err?.response?.data);
      
      // Try different ways to extract the error message
      let errorMessage = 'Update failed';
      
      // Check if the error response has data with a message
      if (err?.response?.data) {
        const data = err.response.data;
        
        // Try multiple possible message fields
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.details) {
          errorMessage = data.details;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('Extracted error message:', errorMessage);      // Check for duplicate email errors with various patterns
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('email already exists') || 
          lowerMsg.includes('email already') || 
          lowerMsg.includes('duplicate email') ||
          lowerMsg.includes('email is already') ||
          (err?.response?.status === 409 && lowerMsg.includes('email'))) { // 409 Conflict status for email
        setEmailError(errorMessage);
      } else if (lowerMsg.includes('phone number must be numeric') || 
                 lowerMsg.includes('phone must be') ||
                 lowerMsg.includes('invalid phone') ||
                 (lowerMsg.includes('phone number') && lowerMsg.includes('numeric'))) { // Phone validation errors
        setPhoneError(errorMessage);
      } else {
        setError(errorMessage);
      }    }
  };

  const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  };

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    try {
      // @ts-ignore
      const { changePassword } = await import('../api/userApi');
      await changePassword(pwdForm);
      setPwdSuccess('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '' });
      setChangePwdModalOpen(false);
      // Refetch user info after password change
      const res = await getUserInfo();
      setUser(res.data);
      setEditForm(res.data);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 shadow-xl">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">User Profile</h1>
              <p className="text-white/80 text-lg">Manage your account information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {user.username}
              </h2>
              <div className="flex gap-2 mt-2">
                <span className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-sm font-semibold px-4 py-2 rounded-full border border-purple-200">
                  Last Updated: {formatDate(user.updatedAt)}
                </span>
              </div>
            </div>
          </div>          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">{error}</div>}
          {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">{success}</div>}
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-gray-600 font-medium">Loading profile...</span>
            </div>
          ) : (
            <>
              {/* Profile Information Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span className="font-semibold text-blue-800">Email</span>
                  </div>
                  <p className="text-blue-900 font-medium">{user.email}</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-semibold text-green-800">Phone</span>
                  </div>
                  <p className="text-green-900 font-medium">{user.phone || <span className="italic text-gray-500">Not provided</span>}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-purple-800">Company</span>
                  </div>
                  <p className="text-purple-900 font-medium">{user.companyName || <span className="italic text-gray-500">Not provided</span>}</p>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-semibold text-amber-800">Major</span>
                  </div>
                  <p className="text-amber-900 font-medium">{user.major}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => {
                    setModalOpen(true);
                    setError('');
                    setEmailError('');
                    setPhoneError('');
                    setSuccess('');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setChangePwdModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                >
                  <LockClosedIcon className="h-5 w-5" />
                  Change Password
                </button>
              </div>
            </>
          )}        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={modalOpen} onClose={() => {
        setModalOpen(false);
        setError('');
        setEmailError('');
        setPhoneError('');
      }} title="Edit User Info" showFooterActions={false}>        <form onSubmit={handleEditSubmit} className="space-y-6">
          {error && !emailError && !phoneError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input 
              name="username" 
              value={editForm.username} 
              readOnly 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed focus:outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              name="email" 
              value={editForm.email} 
              onChange={handleEditChange} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
            {emailError && <p className="text-sm text-red-500 mt-2">{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input 
              name="phone" 
              value={editForm.phone} 
              onChange={handleEditChange} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
            {phoneError && <p className="text-sm text-red-500 mt-2">{phoneError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input 
              name="companyName" 
              value={editForm.companyName || ''} 
              onChange={handleEditChange} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
            <select 
              name="major" 
              value={majors.includes(editForm.major) ? editForm.major : 'Enter Manually'} 
              onChange={handleEditChange} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {majors.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="Enter Manually">Enter Manually...</option>
            </select>            {(!majors.includes(editForm.major) || editForm.major === 'Enter Manually') && (
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-xl mt-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your major"
                value={customMajor}
                onChange={e => setCustomMajor(e.target.value)}
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => {
                setModalOpen(false);
                setError('');
                setEmailError('');
                setPhoneError('');
              }} 
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              Save Changes
            </button>
          </div>        </form>
        </Modal>

      <Modal isOpen={changePwdModalOpen} onClose={() => setChangePwdModalOpen(false)} title="Change Password" showFooterActions={false}>
        <form onSubmit={handlePwdSubmit} className="space-y-6">
          {pwdError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{pwdError}</div>}
          {pwdSuccess && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{pwdSuccess}</div>}
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type={showPwdCurrent ? 'text' : 'password'}
              name="currentPassword"
              value={pwdForm.currentPassword}
              onChange={handlePwdChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-11 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPwdCurrent(v => !v)}
              aria-label={showPwdCurrent ? 'Hide password' : 'Show password'}
            >
              {showPwdCurrent ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type={showPwdNew ? 'text' : 'password'}
              name="newPassword"
              value={pwdForm.newPassword}
              onChange={handlePwdChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-11 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPwdNew(v => !v)}
              aria-label={showPwdNew ? 'Hide password' : 'Show password'}
            >
              {showPwdNew ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setChangePwdModalOpen(false)} 
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              Change Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;
