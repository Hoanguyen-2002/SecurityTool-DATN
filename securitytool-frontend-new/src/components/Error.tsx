import React from 'react';
const Error: React.FC<{ message?: string }> = ({ message }) => (
  <div className="text-red-500">Error: {message || 'Something went wrong'}</div>
);
export default Error;