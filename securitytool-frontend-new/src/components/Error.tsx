import React, { useState, useEffect } from 'react';

interface ErrorProps {
  message?: string | null; 
}

const ErrorDisplay: React.FC<ErrorProps> = ({ message }) => {
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (message && message.trim() !== '') {
      setVisibleMessage(message);
      timer = setTimeout(() => {
        setVisibleMessage(null);
      }, 5000);
    } else {
      setVisibleMessage(null);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  if (!visibleMessage) {
    return null;
  }

  return (
    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
      <span className="font-medium">Error: </span> {visibleMessage}
    </div>
  );
};

export default ErrorDisplay;