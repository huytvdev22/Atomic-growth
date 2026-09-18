import React, { useEffect, useState, useRef } from 'react';
import { ToastItem as IToastItem } from '../../types/toast';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastItemProps {
  toast: IToastItem;
  onDismiss: (id: string) => void;
}

/**
 * Thành phần hiển thị một Toast đơn lẻ theo phong cách Modern Botanical Zen
 * Tích hợp thanh tiến trình đếm ngược, hỗ trợ pause-on-hover và nút hành động nhanh
 */
export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { id, type, title, message, duration = 4000, action } = toast;
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (duration <= 0) return;

    let animationFrameId: number;

    const tick = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        const currentProgress = (remaining / duration) * 100;
        setProgress(currentProgress);

        if (remaining <= 0) {
          onDismiss(id);
          return;
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (!isPaused) {
      startTimeRef.current = Date.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [id, duration, isPaused, onDismiss]);

  const handleMouseEnter = () => {
    if (duration <= 0) return;
    setIsPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    if (duration <= 0) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  // Cấu hình giao diện và màu sắc theo từng loại Toast (Botanical Zen Semantics)
  const config = {
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-semantic-amber" />,
      iconBg: 'bg-semantic-amber-bg text-semantic-amber',
      accentBar: 'bg-semantic-amber',
      badgeText: 'Cảnh báo',
      badgeBg: 'bg-semantic-amber-bg text-semantic-amber border-semantic-amber/30'
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-semantic-terracotta" />,
      iconBg: 'bg-semantic-terracotta-bg text-semantic-terracotta',
      accentBar: 'bg-semantic-terracotta',
      badgeText: 'Trục trặc',
      badgeBg: 'bg-semantic-terracotta-bg text-semantic-terracotta border-semantic-terracotta/30'
    },
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-accent-sprout" />,
      iconBg: 'bg-accent-sprout-soft text-on-accent-sprout',
      accentBar: 'bg-accent-sprout',
      badgeText: 'Thành công',
      badgeBg: 'bg-accent-sprout-soft text-on-accent-sprout border-accent-sprout/30'
    },
    info: {
      icon: <Info className="h-5 w-5 text-semantic-sky" />,
      iconBg: 'bg-semantic-sky-bg text-semantic-sky',
      accentBar: 'bg-semantic-sky',
      badgeText: 'Thông tin',
      badgeBg: 'bg-semantic-sky-bg text-semantic-sky border-semantic-sky/30'
    }
  }[type];

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/90 bg-surface/95 p-3.5 sm:p-4',
        'shadow-window backdrop-blur-md transition-all duration-300 select-none',
        'animate-in fade-in slide-in-from-top-2 sm:slide-in-from-right-4'
      )}
    >
      {/* 1. Dải màu trang trí phía trên thẻ theo chuẩn Elera */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', config.accentBar)} />

      <div className="flex items-start gap-3 pt-0.5">
        {/* Biểu tượng trạng thái */}
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105',
            config.iconBg
          )}
        >
          {config.icon}
        </div>

        {/* Nội dung Toast */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="font-sans text-sm font-semibold tracking-tight text-text-primary">
              {title}
            </h4>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border',
                config.badgeBg
              )}
            >
              {config.badgeText}
            </span>
          </div>

          {message && (
            <p className="mt-1 text-xs text-text-secondary leading-relaxed font-sans line-clamp-3">
              {message}
            </p>
          )}

          {/* Nút hành động đính kèm nếu có */}
          {action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onDismiss(id);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer',
                  'bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-xs'
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {/* Nút đóng Toast (X) */}
        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label="Đóng thông báo"
          className="rounded-lg p-1 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Thanh tiến trình đếm ngược thời gian tự đóng */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/40 overflow-hidden">
          <div
            className={cn('h-full transition-all ease-linear', config.accentBar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
