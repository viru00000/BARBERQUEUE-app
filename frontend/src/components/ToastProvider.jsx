import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext({ add: () => {} });

export const useToast = () => useContext(ToastContext);

const Toast = ({ toast, onClose }) => {
  const { id, type, message } = toast;
  const base = 'min-w-[280px] max-w-[90vw] md:max-w-md rounded-xl px-5 py-4 shadow-2xl border text-center cursor-pointer transition-all duration-300';
  const theme = type === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-900/70 border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-100'
    : type === 'error'
    ? 'bg-red-50 dark:bg-red-900/70 border-red-200 dark:border-red-500/40 text-red-800 dark:text-red-100'
    : 'bg-gray-50 dark:bg-gray-900/70 border-gray-200 dark:border-gray-600/40 text-gray-800 dark:text-gray-100';
  return (
    <div className={`${base} ${theme}`} role="alert" onClick={() => onClose(id)}>
      <div className="text-sm leading-relaxed">{message}</div>
    </div>
  );
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, duration = 2500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    window.appToast = {
      success: (m, d) => add('success', m, d),
      error: (m, d) => add('error', m, d),
      info: (m, d) => add('info', m, d),
    };
    return () => { delete window.appToast; };
  }, [add]);

  const ctx = useMemo(() => ({ add }), [add]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Centered overlay */}
      <div className="fixed inset-0 pointer-events-none flex items-start justify-center mt-24 z-[1000]">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onClose={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;


