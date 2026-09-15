import React from 'react';
import { useAppUpdate } from '../context/UpdateContext';
import { RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface VersionBadgeProps {
  className?: string;
  showStatusText?: boolean;
}

/**
 * Component nút phiên bản dạng "🔄 v1.0.0 🟠"
 * Lấy cảm hứng trực tiếp từ FlareMo và Family Expense Manager
 * Cho phép người dùng bấm vào để kiểm tra bản cập nhật mới
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  className,
  showStatusText = true,
}) => {
  const {
    currentVersion,
    hasUpdate,
    isChecking,
    statusMessage,
    checkForUpdate,
  } = useAppUpdate();

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <button
        type="button"
        onClick={checkForUpdate}
        disabled={isChecking}
        title="Bấm để kiểm tra bản cập nhật mới"
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-text-tertiary transition-all cursor-pointer select-none',
          'hover:bg-canvas-subtle hover:text-text-primary',
          hasUpdate && 'bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/15 font-semibold'
        )}
      >
        <RotateCw
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-500',
            isChecking && 'animate-spin text-primary',
            'group-hover:rotate-180'
          )}
        />
        <span className="font-mono text-[11px]">v{currentVersion}</span>

        {/* Chấm tròn báo hiệu có bản cập nhật mới (như FlareMo 🟠) */}
        {hasUpdate && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-amber opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-amber" />
          </span>
        )}
      </button>

      {/* Dòng trạng thái phản hồi ngắn khi kiểm tra */}
      {showStatusText && statusMessage && (
        <div className="flex items-center gap-1 text-[10px] text-text-secondary animate-in fade-in duration-200 px-1">
          {statusMessage.includes('mới nhất') ? (
            <CheckCircle2 className="h-3 w-3 text-accent-sage shrink-0" />
          ) : hasUpdate ? (
            <AlertCircle className="h-3 w-3 text-accent-amber shrink-0" />
          ) : null}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
