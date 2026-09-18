import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ToastItem, ToastType, ToastOptions, ToastContextType } from '../types/toast';
import { ToastContainer } from '../components/common/ToastContainer';

const ToastContext = createContext<ToastContextType | null>(null);

// Giới hạn tối đa số lượng Toast xuất hiện đồng thời để bảo đảm nguyên tắc Anti-Clutter (DESIGN.md)
const MAX_TOASTS = 4;

// Bộ điều phối sự kiện toàn cục (Global Dispatcher) cho phép gọi toast từ mọi nơi (services, utils, callbacks)
type ToastHandler = (type: ToastType, title: string, message?: string, options?: ToastOptions) => string;
type DismissHandler = (id: string) => void;
type ClearHandler = () => void;

let globalShowToast: ToastHandler = () => '';
let globalDismissToast: DismissHandler = () => {};
let globalClearToasts: ClearHandler = () => {};

/**
 * Singleton Toast Dispatcher dùng chung ngoài React Components:
 * Ví dụ: toast.warning('Cảnh báo mạng', 'Không thể kết nối Cloud Firestore');
 */
export const toast = {
  show: (type: ToastType, title: string, message?: string, options?: ToastOptions) =>
    globalShowToast(type, title, message, options),
  warning: (title: string, message?: string, options?: ToastOptions) =>
    globalShowToast('warning', title, message, options),
  error: (title: string, message?: string, options?: ToastOptions) =>
    globalShowToast('error', title, message, options),
  success: (title: string, message?: string, options?: ToastOptions) =>
    globalShowToast('success', title, message, options),
  info: (title: string, message?: string, options?: ToastOptions) =>
    globalShowToast('info', title, message, options),
  dismiss: (id: string) => globalDismissToast(id),
  clear: () => globalClearToasts()
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, options?: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        duration: options?.duration !== undefined ? options.duration : 4000,
        action: options?.action,
        createdAt: Date.now()
      };

      setToasts((prev) => {
        // Đưa toast mới lên đầu danh sách và cắt bớt nếu vượt quá số lượng tối đa
        const updated = [newToast, ...prev];
        return updated.slice(0, MAX_TOASTS);
      });

      return id;
    },
    []
  );

  const warning = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      showToast('warning', title, message, options),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      showToast('error', title, message, options),
    [showToast]
  );

  const success = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      showToast('success', title, message, options),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: ToastOptions) =>
      showToast('info', title, message, options),
    [showToast]
  );

  // Đăng ký bộ phát sự kiện toàn cục
  globalShowToast = showToast;
  globalDismissToast = dismissToast;
  globalClearToasts = clearAll;

  const value = useMemo<ToastContextType>(
    () => ({
      toasts,
      showToast,
      warning,
      error,
      success,
      info,
      dismissToast,
      clearAll
    }),
    [toasts, showToast, warning, error, success, info, dismissToast, clearAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Khung hiển thị Toast tự động nhúng vào Provider */}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Hook sử dụng Toast bên trong các React component
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong <ToastProvider>');
  }
  return context;
};
