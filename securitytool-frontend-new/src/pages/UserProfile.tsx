import React, { useEffect, useState } from 'react';
import { editUserInfo, logout, getUserInfo } from '../api/userApi';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { PencilSquareIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

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
  });
  const [editForm, setEditForm] = useState(user);
  const [modalOpen, setModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await getUserInfo();
        setUser(res.data);
        setEditForm(res.data);
      } catch (err: any) {
        setError('Failed to load user info');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await editUserInfo(editForm);
      setUser(editForm);
      setSuccess('Information updated successfully!');
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
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

  return (
    <div className="max-w-2xl ml-10 mt-10 bg-white rounded-xl shadow-lg p-10 relative border border-gray-200">
      {/* Card Title: Username */}
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <span className="text-blue-700">{user.username}</span>
      </h2>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-4 flex items-center">
            <div className="w-1/3 font-semibold text-gray-600">Email:</div>
            <div className="w-2/3">{user.email}</div>
          </div>
          <div className="mb-4 flex items-center">
            <div className="w-1/3 font-semibold text-gray-600">Phone:</div>
            <div className="w-2/3">{user.phone}</div>
          </div>
          <div className="mb-8 flex items-center">
            <div className="w-1/3 font-semibold text-gray-600">Major:</div>
            <div className="w-2/3">{user.major}</div>
          </div>
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm"
              title="Edit"
            >
              <PencilSquareIcon className="h-5 w-5" />
              Edit
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow-sm"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit User Info" showFooterActions={false}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Username</label>
            <input name="username" value={editForm.username} onChange={handleEditChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1">Phone</label>
            <input name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1">Major</label>
            <select name="major" value={editForm.major} onChange={handleEditChange} className="w-full px-3 py-2 border rounded">
              {majors.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserProfile;
