import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Tùy biến class của khung container Bottom Sheet (mặc định: 'max-w-lg') */
  className?: string;
  /** Tùy biến class của vùng nội dung bên trong (mặc định: 'p-6 overflow-y-auto space-y-4') */
  contentClassName?: string;
  /** Component hoặc thanh công cụ phụ đặt ngay dưới Header (ví dụ Zen Progress Bar) */
  headerExtra?: React.ReactNode;
  /** Tùy chọn ẩn toàn bộ Header mặc định */
  hideHeader?: boolean;
  /** Bật/tắt thanh gạt kéo vuốt phía trên (mặc định: true) */
  showDragHandle?: boolean;
}

/**
 * Component BottomSheet dùng chung (Common Core Component)
 * Tự động chuyển đổi: Bottom Sheet bám đáy màn hình trên Mobile / PWA và Modal thanh lịch trên Desktop.
 * Tích hợp:
 * - Cử chỉ vuốt kéo xuống đóng (Swipe-Down Dismiss Gesture)
 * - Khóa cuộn trang nền (Body Scroll Lock)
 * - React Portal đưa ra ngoài root DOM
 * - Hỗ trợ vùng an toàn thiết bị di động (pb-safe)
 * - Đóng bằng phím Escape
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  className,
  contentClassName,
  headerExtra,
  hideHeader = false,
  showDragHandle = true
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Khóa cuộn trang khi modal đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setDragY(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Xử lý kéo vuốt đóng bằng cảm ứng (Touch Gesture)
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  // Đóng khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Lớp phủ Backdrop làm mờ */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Khung Sheet Nội Dung */}
      <div
        ref={sheetRef}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface border-t sm:border border-border shadow-2xl pb-safe max-h-[92dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 sm:duration-200',
          className
        )}
      >
        {/* Thanh gạt kéo vuốt phía trên (Drag Handle) cho Mobile */}
        {showDragHandle && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none sm:hidden shrink-0 touch-none"
          >
            <div className="w-12 h-1.5 rounded-full bg-border" />
          </div>
        )}

        {/* Header Modal */}
        {!hideHeader && (title || icon) && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border-subtle shrink-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-sprout text-primary shrink-0 shadow-2xs">
                  {icon}
                </div>
              )}
              <div className="truncate">
                {typeof title === 'string' ? (
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-text-primary truncate">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-xs text-text-secondary truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-full p-1.5 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Thanh bổ sung dưới Header (ví dụ Progress Bar) */}
        {headerExtra && <div className="shrink-0">{headerExtra}</div>}

        {/* Nội dung cuộn bên trong */}
        <div
          className={cn(
            'p-6 overflow-y-auto space-y-4 flex-1',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
