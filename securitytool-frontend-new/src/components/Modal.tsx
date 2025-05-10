import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // onConfirm is only needed if showFooterActions is true
  title: string;
  children: React.ReactNode;
  confirmButtonText?: string; // confirmButtonText is only needed if showFooterActions is true
  isConfirmDisabled?: boolean; // isConfirmDisabled is only needed if showFooterActions is true
  showFooterActions?: boolean; // New prop
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmButtonText = 'OK',
  isConfirmDisabled = false,
  showFooterActions = true, // Default to true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div>{children}</div>
        {showFooterActions && onConfirm && ( // Conditionally render footer
          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              disabled={isConfirmDisabled}
            >
              {confirmButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
