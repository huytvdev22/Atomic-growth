/**
 * Định nghĩa các loại thông báo Toast trong Atomic Growth
 */
export type ToastType = 'warning' | 'error' | 'success' | 'info';

/**
 * Cấu hình nút hành động đi kèm trong Toast
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Cấu trúc dữ liệu của một thông báo Toast
 */
export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // Thời gian hiển thị (ms), mặc định 4000ms. Nếu = 0 thì không tự tắt
  action?: ToastAction;
  createdAt: number;
}

/**
 * Các tùy chọn khi phát sinh Toast (không cần truyền id và createdAt)
 */
export type ToastOptions = Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>;

/**
 * Kiểu dữ liệu của ToastContext
 */
export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, title: string, message?: string, options?: ToastOptions) => string;
  warning: (title: string, message?: string, options?: ToastOptions) => string;
  error: (title: string, message?: string, options?: ToastOptions) => string;
  success: (title: string, message?: string, options?: ToastOptions) => string;
  info: (title: string, message?: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}
