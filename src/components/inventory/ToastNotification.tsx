import React, { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle, X, CircleAlert as AlertCircle } from 'lucide-react';

interface ToastNotificationProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  isVisible,
  message,
  onClose,
  type = 'success',
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-6 right-6 z-50 transition-all duration-300 ${
      isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
    }`}>
      <div className={`flex items-center p-4 rounded-xl shadow-2xl border backdrop-blur-sm min-w-[300px] max-w-md transform transition-all duration-300 ${
        isExiting ? 'scale-95' : 'scale-100'
      } ${
        type === 'success'
          ? 'bg-white/95 dark:bg-gray-800/95 border-green-200 dark:border-green-800 shadow-green-100 dark:shadow-green-900/50'
          : 'bg-white/95 dark:bg-gray-800/95 border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/50'
      }`}>
        <div className={`flex-shrink-0 mr-3 p-2 rounded-full ${
          type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};