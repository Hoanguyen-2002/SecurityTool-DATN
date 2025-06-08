import React, { useEffect, useState, useRef } from 'react';
import { editUserInfo, logout, getUserInfo } from '../api/userApi';
import { useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState(''); // Add specific email error state
  const [phoneError, setPhoneError] = useState(''); // Add specific phone error state
  const [loading, setLoading] = useState(true);
  const [forceLogoutModal, setForceLogoutModal] = useState(false);
  const [forceLogoutMsg, setForceLogoutMsg] = useState('');
  const [customMajor, setCustomMajor] = useState(editForm.major && !majors.includes(editForm.major) ? editForm.major : '');
  const [changePwdModalOpen, setChangePwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const prevUsername = useRef(user.username);
  const navigate = useNavigate();

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
      
      console.log('Extracted error message:', errorMessage);
        // Check for duplicate email errors with various patterns
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
                 lowerMsg.includes('phone number') && lowerMsg.includes('numeric')) { // Phone validation errors
        setPhoneError(errorMessage);
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem('authToken');
      navigate('/login');
    }
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
    <>
      <h1 className="text-3xl font-bold mb-8 ml-4 mt-8">User Profile</h1>
      <div className="w-full bg-white rounded-2xl shadow-lg p-10 border border-gray-200 flex flex-col min-h-[400px] justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-blue-700">{user.username}</h2>
              <div className="flex gap-2 mt-2">
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Updated: {formatDate(user.updatedAt)}
                </span>
              </div>
            </div>
          </div>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          {success && <div className="mb-4 text-green-600">{success}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="mb-4 flex items-center">
                <div className="w-28 font-semibold text-gray-600">Email:</div>
                <div>{user.email}</div>
              </div>
              <div className="mb-4 flex items-center">
                <div className="w-28 font-semibold text-gray-600">Phone:</div>
                <div>{user.phone}</div>
              </div>
              <div className="mb-4 flex items-center">
                <div className="w-28 font-semibold text-gray-600">Company:</div>
                <div>{user.companyName || <span className="text-gray-400 italic">Not provided</span>}</div>
              </div>
              <div className="mb-8 flex items-center">
                <div className="w-28 font-semibold text-gray-600">Major:</div>
                <div>{user.major}</div>
              </div>
              <div className="flex gap-4 mb-8">                <button                  onClick={() => {
                    setModalOpen(true);
                    setError('');
                    setEmailError('');
                    setPhoneError('');
                    setSuccess('');
                  }}
                  className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm"
                  title="Edit"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setChangePwdModalOpen(true)}
                  className="flex items-center gap-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 shadow-sm"
                  title="Change Password"
                >
                  <LockClosedIcon className="h-5 w-5" />
                  Change Password
                </button>
              </div>
            </>
          )}
        </div>
        {/* Remove the logout button from the bottom of the profile card */}        <Modal isOpen={modalOpen} onClose={() => {
          setModalOpen(false);
          setError('');
          setEmailError('');
          setPhoneError('');
        }} title="Edit User Info" showFooterActions={false}>          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && !emailError && !phoneError && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <div>
              <label className="block mb-1">Username</label>
              <input name="username" value={editForm.username} readOnly className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed" />
            </div><div>
              <label className="block mb-1">Email</label>
              <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required className="w-full px-3 py-2 border rounded" />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>            <div>
              <label className="block mb-1">Phone</label>
              <input name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>
            <div>
              <label className="block mb-1">Company Name</label>
              <input name="companyName" value={editForm.companyName || ''} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block mb-1">Major</label>
              <select name="major" value={majors.includes(editForm.major) ? editForm.major : 'Enter Manually'} onChange={handleEditChange} className="w-full px-3 py-2 border rounded">
                {majors.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value="Enter Manually">Enter Manually...</option>
              </select>
              {(!majors.includes(editForm.major) || editForm.major === 'Enter Manually') && (
                <input
                  className="w-full px-3 py-2 border rounded mt-2"
                  placeholder="Enter your major"
                  value={customMajor}
                  onChange={e => {
                    setEditForm({ ...editForm, major: 'Enter Manually' });
                  }}
                  required
                />
              )}
            </div>            <div className="flex justify-end gap-2 pt-2">              <button type="button" onClick={() => {
                setModalOpen(false);
                setError('');
                setEmailError('');
                setPhoneError('');
              }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
            </div>
          </form>
        </Modal>
        <Modal
          isOpen={forceLogoutModal}
          onClose={() => {}}
          title="Username Changed"
          showFooterActions={false}
        >
          <div className="mb-4">{forceLogoutMsg}</div>
        </Modal>
        <Modal isOpen={changePwdModalOpen} onClose={() => setChangePwdModalOpen(false)} title="Change Password" showFooterActions={false}>
          <form onSubmit={handlePwdSubmit} className="space-y-4">
            {pwdError && <div className="text-red-500">{pwdError}</div>}
            {pwdSuccess && <div className="text-green-600">{pwdSuccess}</div>}
            <div className="relative">
              <label className="block mb-1">Current Password</label>
              <input
                type={showPwdCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={pwdForm.currentPassword}
                onChange={handlePwdChange}
                required
                className="w-full px-3 py-2 border rounded pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3"
                style={{ top: '70%', transform: 'translateY(-50%)' }}
                onClick={() => setShowPwdCurrent(v => !v)}
                aria-label={showPwdCurrent ? 'Hide password' : 'Show password'}
              >
                {showPwdCurrent ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative">
              <label className="block mb-1">New Password</label>
              <input
                type={showPwdNew ? 'text' : 'password'}
                name="newPassword"
                value={pwdForm.newPassword}
                onChange={handlePwdChange}
                required
                className="w-full px-3 py-2 border rounded pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3"
                style={{ top: '70%', transform: 'translateY(-50%)' }}
                onClick={() => setShowPwdNew(v => !v)}
                aria-label={showPwdNew ? 'Hide password' : 'Show password'}
              >
                {showPwdNew ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setChangePwdModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Change</button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
};

export default UserProfile;
