import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarItem {
  label: string;
  path: string;
  isPending?: boolean;
}

const items: SidebarItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Applications', path: '/applications' },
  { label: 'Modules', path: '/modules', isPending: true },
  { label: 'Scan Config', path: '/scan-config' },
  { label: 'Business Flow Analyzer', path: '/flow-analyzer' },
  { label: 'Reports', path: '/reports' }
];

const Sidebar: React.FC = () => (
  <nav className="w-64 bg-gray-800 text-white flex-shrink-0">
    <div className="p-4 text-2xl font-bold">Security Tool</div>
    <ul>
      {items.map(item => (
        <li key={item.path} className={`p-4 hover:bg-gray-700 ${item.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Link to={item.path} className="flex items-center">
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