import React from 'react';
import { Sprout } from 'lucide-react';

/**
 * ZenSplashLoader - Màn hình chờ tĩnh tại mang tinh thần Botanical Zen
 * Hiển thị mượt mà trong khoảng ~300ms khi ứng dụng kiểm tra phiên đăng nhập,
 * loại bỏ hoàn toàn hiện tượng giật màn hình (Flash of Unauthenticated Content).
 */
export const ZenSplashLoader: React.FC = () => {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-canvas text-text-primary px-4 select-none">
      <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
        {/* Biểu tượng mầm non nhẹ nhàng */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-sprout text-primary shadow-xs">
          <Sprout className="w-7 h-7 animate-pulse" />
        </div>

        {/* Tiêu đề thanh nhã chuẩn Newsreader Serif */}
        <div className="text-center space-y-1">
          <h1 className="font-serif text-xl font-bold tracking-tight text-primary">
            Atomic Growth
          </h1>
          <p className="font-serif italic text-xs text-text-secondary">
            Kiến tạo bản sắc bền vững từ 1% mỗi ngày
          </p>
        </div>

        {/* Điểm chỉ báo nạp tĩnh lặng (Hairline Zen Indicator) */}
        <div className="w-24 h-0.5 bg-border-subtle overflow-hidden rounded-full mt-2">
          <div className="w-full h-full bg-accent-sage animate-pulse" />
        </div>
      </div>
    </div>
  );
};
