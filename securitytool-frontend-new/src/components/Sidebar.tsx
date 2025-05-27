import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, FolderIcon, CogIcon, BeakerIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
  { label: 'Reports', path: '/reports', icon: <DocumentTextIcon className="h-5 w-5 mr-3" /> }
];

const Sidebar: React.FC = () => (
  <nav className="w-64 bg-gray-800 text-white flex-shrink-0">
    <div className="p-4 text-2xl font-bold">Security Tool</div>
    <ul>
      {items.map(item => (
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
  </nav>
);

export default Sidebar;