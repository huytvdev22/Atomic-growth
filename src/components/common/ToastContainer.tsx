import React from 'react';
import { useToast } from '../../context/ToastContext';
import { ToastItem } from './ToastItem';

/**
 * Khung hiển thị danh sách các Toast thông báo (Toast Container)
 * Cố định ở góc trên màn hình, tối ưu responsive trên cả Mobile và Desktop
 */
export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 sm:w-96 z-[60] pointer-events-none flex flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </aside>
  );
};
