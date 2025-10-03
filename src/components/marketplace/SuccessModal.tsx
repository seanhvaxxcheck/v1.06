import React, { useEffect } from 'react';
import { CircleCheck as CheckCircle, X } from 'lucide-react';

interface SuccessModalProps {
  onClose: () => void;
  message?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  onClose,
  message = 'Listing created successfully!'
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-scale-in">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
            <CheckCircle className="h-20 w-20 text-green-500 relative z-10" strokeWidth={1.5} />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Success!
          </h3>

          <p className="text-gray-600 dark:text-gray-300">
            {message}
          </p>

          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
