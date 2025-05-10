import React from 'react';
import { Link } from 'react-router-dom';
const items = [
  ['Dashboard','/dashboard'],
  ['Applications','/applications'],
  ['Modules','/modules'],
  ['Scan Config','/scan-config'],
  ['Flow Analyzer','/flow-analyzer'],
  ['Reports','/reports']
];
const Sidebar: React.FC = () => (
  <nav className="w-64 bg-gray-800 text-white flex-shrink-0">
    <div className="p-4 text-2xl font-bold">Security Tool</div>
    <ul>
      {items.map(([label,path]) => (
        <li key={path} className="p-4 hover:bg-gray-700">
          <Link to={path}>{label}</Link>
        </li>
      ))}
    </ul>
  </nav>
);
export default Sidebar;