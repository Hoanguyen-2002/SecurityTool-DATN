import React from 'react';

const ModuleManagement: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center opacity-70"> {/* Added opacity-70 for faded background */}
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center relative">
        {/* Removed the larger lock icon from the side of the card */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"> {/* Ensured lock icon is always visible next to title */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a2 2 0 002-2v-2a2 2 0 00-2-2 2 2 0 00-2 2v2a2 2 0 002 2zm6-6V7a6 6 0 10-12 0v4" />
          </svg>
          Module Management
        </h1>
        <p className="text-lg text-gray-700 mb-2 bg-yellow-100 bg-opacity-60 rounded px-4 py-3" style={{transition: 'background 0.5s'}}>Function is pending and will be released soon.</p>
      </div>
    </div>
  );
};

export default ModuleManagement;