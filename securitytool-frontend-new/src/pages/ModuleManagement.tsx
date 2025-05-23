import React from 'react';

const ModuleManagement: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center relative">
        <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 hidden md:block">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-200 bg-opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6-6V7a6 6 0 10-12 0v4" />
              <rect width="20" height="12" x="2" y="11" rx="2" fill="currentColor" className="text-gray-200" />
            </svg>
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mr-2 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6-6V7a6 6 0 10-12 0v4" />
            <rect width="20" height="12" x="2" y="11" rx="2" fill="currentColor" className="text-gray-200" />
          </svg>
          Module Management
        </h1>
        <p className="text-lg text-gray-700 mb-2 bg-yellow-100 bg-opacity-60 rounded px-4 py-3" style={{transition: 'background 0.5s'}}>Function is pending and will be released soon.</p>
      </div>
    </div>
  );
};

export default ModuleManagement;