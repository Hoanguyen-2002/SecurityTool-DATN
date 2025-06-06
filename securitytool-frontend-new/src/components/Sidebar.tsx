import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeIcon, FolderIcon, CogIcon, BeakerIcon, DocumentTextIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';

interface SidebarItem {
  label: string;
  path: string;
  isPending?: boolean;
  icon?: React.ReactNode;
}

const items: SidebarItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-5 w-5 mr-3" /> },
  { label: 'Applications', path: '/applications', icon: <FolderIcon className="h-5 w-5 mr-3" /> },
  // { label: 'Modules', path: '/modules', isPending: true, icon: <ViewGridIcon className="h-5 w-5 mr-3" /> },
  { label: 'Scan Tools', path: '/scan-config', icon: <CogIcon className="h-5 w-5 mr-3" /> },
  { label: 'Business Flow Analyzer', path: '/flow-analyzer', icon: <BeakerIcon className="h-5 w-5 mr-3" /> },
  { label: 'Reports', path: '/reports', icon: <DocumentTextIcon className="h-5 w-5 mr-3" /> },
  { label: 'User Profile', path: '/user-profile', icon: <UserIcon className="h-5 w-5 mr-3" /> }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const handleLogout = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };
  return (
    <nav className="w-64 bg-gray-800 text-white flex-shrink-0 h-screen flex flex-col">
      <div className="p-4 text-2xl font-bold">Security Tool</div>
      <ul className="flex-1">
        {items.filter(item => item.label !== 'User Profile').map(item => (
          <li key={item.path} className={`p-4 hover:bg-gray-700 ${item.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Link to={item.path} className="flex items-center">
              {item.icon}
              {item.label}
              {item.isPending && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6-6V7a6 6 0 10-12 0v4" />
                </svg>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 mb-4 px-4">
        <Link to="/user-profile" className="flex items-center p-2 hover:bg-gray-700 rounded">
          <UserIcon className="h-5 w-5 mr-2" />
          Profile
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center justify-center gap-1 bg-red-500 text-white p-2 w-16 rounded hover:bg-red-600 shadow-sm ml-2"
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
        <Modal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title="Confirm Logout"
          showFooterActions={false}
        >
          <div className="flex flex-col items-center mb-8">
            <ArrowRightOnRectangleIcon className="h-12 w-12 text-red-500 mb-4" />
            <div className="text-xl text-gray-800 font-bold text-center">Do you want to log out?</div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </Modal>
      </div>
    </nav>
  );
};

export default Sidebar;