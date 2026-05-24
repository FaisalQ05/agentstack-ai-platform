'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

// Global handler (initialized later safely)
let addToastHandler:
  | ((message: string, type?: ToastType, duration?: number) => void)
  | null = null;

export const toast = (
  message: string,
  type: ToastType = 'info',
  duration?: number
) => {
  if (addToastHandler) addToastHandler(message, type, duration);
  else console.warn('Toast system not initialized yet!');
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const MAX_TOASTS = 3;

  const addToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = 4000
  ) => {
    const id = uuidv4();
    setToasts((prev) =>
      [...prev, { id, message, type, duration }].slice(-MAX_TOASTS)
    );
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ✅ Assign the global handler after mount
  useEffect(() => {
    addToastHandler = addToast;
    return () => {
      addToastHandler = null; // cleanup when provider unmounts
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast container
const colors: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-400 text-black',
};

const ToastContainer = ({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) => (
  <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`px-4 py-2 rounded shadow text-white ${colors[t.type]} max-w-sm flex justify-between items-center`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-2 font-bold hover:text-gray-200"
          >
            ✕
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// Optional hook
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
