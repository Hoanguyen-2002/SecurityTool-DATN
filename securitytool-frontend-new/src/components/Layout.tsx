import React from 'react';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex flex-col flex-1">
      <main className="p-6 overflow-auto bg-gray-100">
        <div className="bg-white shadow rounded-lg p-4">
          {children}
        </div>
      </main>
    </div>
  </div>
);

export default Layout;