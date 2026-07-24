import React, { createContext, useState, useCallback } from 'react';
import { announce } from '../utils/speechAnnouncer';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Add a toast notification.
   * Automatically announces via ARIA live region + speech synthesis.
   *
   * @param {string} message - Toast message.
   * @param {'info'|'success'|'warning'|'error'} type - Notification style.
   * @param {number} duration - Auto-dismiss duration in ms.
   */
  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // Announce via ARIA live region & Speech Synthesis
      const priority = type === 'error' ? 'assertive' : 'polite';
      const prefix =
        type === 'error'
          ? 'Error: '
          : type === 'success'
          ? 'Success: '
          : type === 'warning'
          ? 'Warning: '
          : '';
      announce(`${prefix}${message}`, priority, true);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const typeClasses = {
            info: 'bg-indigo-900 border-indigo-500 text-indigo-100',
            success: 'bg-emerald-900 border-emerald-500 text-emerald-100',
            warning: 'bg-amber-900 border-amber-500 text-amber-100',
            error: 'bg-red-900 border-red-500 text-red-100',
          }[toast.type];

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
              className={`pointer-events-auto p-4 rounded-xl border-2 shadow-2xl flex items-center justify-between gap-3 text-sm font-medium anim-slide-up ${typeClasses}`}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="btn btn-ghost btn-icon btn-sm text-white/70 hover:text-white"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
