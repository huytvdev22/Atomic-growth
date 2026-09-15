import React from 'react';
import { useAppUpdate } from '../context/UpdateContext';
import { RotateCw, Sparkles, X } from 'lucide-react';

/**
 * Toast thông báo có phiên bản mới
 * Xuất hiện khi Service Worker phát hiện bản build mới hoặc có thay đổi trên server
 */
export const UpdateToast: React.FC = () => {
  const { hasUpdate, latestVersion, releaseNotes, applyUpdate, dismissUpdate } = useAppUpdate();

  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-accent-sage/40 bg-surface/95 p-4 shadow-xl backdrop-blur-md transition-all">
        {/* Điểm nhấn dải màu trang trí phía trên */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-sage via-primary to-accent-amber" />

        <div className="flex items-start gap-3 pt-1">
          {/* Icon nổi bật */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-sprout/60 text-primary shadow-2xs">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          {/* Chi tiết bản cập nhật */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h4 className="font-sans text-sm font-bold text-text-primary">
                Bản cập nhật mới sẵn sàng!
              </h4>
              {latestVersion && (
                <span className="rounded-full bg-accent-amber/20 px-2 py-0.5 font-mono text-[10px] font-bold text-accent-amber">
                  v{latestVersion}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {releaseNotes ||
                'Phiên bản mới đã được tải sẵn. Hãy làm mới ứng dụng để áp dụng các cải tiến mới nhất!'}
            </p>

            {/* Các nút hành động */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={applyUpdate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5 stroke-[2.2]" />
                <span>Cập nhật ngay</span>
              </button>

              <button
                type="button"
                onClick={dismissUpdate}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>

          {/* Nút X đóng */}
          <button
            type="button"
            onClick={dismissUpdate}
            aria-label="Đóng thông báo"
            className="absolute top-3 right-3 rounded-md p-1 text-text-tertiary hover:bg-canvas-subtle hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
