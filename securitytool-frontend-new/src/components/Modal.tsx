import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string; // Added for consistency
  isConfirmDisabled?: boolean;
  showFooterActions?: boolean; // If false, hides the entire footer
  showConfirmButton?: boolean; // Explicitly show/hide confirm button
  showCancelButton?: boolean;  // Explicitly show/hide cancel button
  maxWidthClass?: string; // New prop for custom max-width
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmButtonText = 'OK',
  cancelButtonText = 'Cancel', // Added
  isConfirmDisabled = false,
  showFooterActions = true,    // Default to true, meaning footer is visible unless specified
  showConfirmButton = true,  // Default to true
  showCancelButton = true,   // Default to true
  maxWidthClass = 'max-w-md', // Default max-width
}) => {
  if (!isOpen) return null;

  // Determine if any part of the footer should be rendered
  const shouldRenderFooter = showFooterActions && (showConfirmButton || showCancelButton);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className={`bg-white p-5 rounded-lg shadow-xl w-full ${maxWidthClass} mx-auto`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div>{children}</div>
        {shouldRenderFooter && (
          <div className="mt-6 flex justify-end space-x-2">
            {showCancelButton && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                {cancelButtonText}
              </button>
            )}
            {showConfirmButton && onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                disabled={isConfirmDisabled}
              >
                {confirmButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
