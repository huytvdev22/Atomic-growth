import React, { useRef, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface SwipeBackViewProps {
  children: React.ReactNode;
  /** Hàm callback kích hoạt khi cử chỉ vuốt hoàn tất thành công */
  onBack: () => void;
  /** Bật/tắt cử chỉ vuốt mép trái (mặc định: true) */
  enabled?: boolean;
  /** Độ rộng vùng mép trái nhận diện cử chỉ tính bằng pixel (mặc định: 28px chuẩn iOS) */
  edgeWidth?: number;
  /** Tùy biến class container */
  className?: string;
}

/**
 * Component Wrapper SwipeBackView - Cung cấp cử chỉ Vuốt Mép Trái để Quay Lại (Edge Swipe to Back)
 * Chuẩn mực trải nghiệm iOS Native trên iPhone PWA:
 * 1. Nhận diện chính xác mép cạnh trái (0 - 28px), không xung đột với tương tác bên trong.
 * 2. Khóa hướng chuyển động (Direction Lock): Phân định vuốt ngang vs cuộn dọc tức thì.
 * 3. Trượt theo ngón tay 1:1 thời gian thực với Direct DOM Ref (đạt 60-120fps không re-render).
 * 4. Đổ bóng cạnh trái (Edge Shadow) phân tách chiều sâu layer.
 * 5. Nhận diện vẩy tay nhanh (Velocity flick) hoặc kéo quá 30% màn hình để kích hoạt Back.
 */
export const SwipeBackView: React.FC<SwipeBackViewProps> = ({
  children,
  onBack,
  enabled = true,
  edgeWidth = 28,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isTrackingRef = useRef(false);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const isBackTriggeredRef = useRef(false);

  // Dọn dẹp an toàn khi component unmount
  useEffect(() => {
    return () => {
      isTrackingRef.current = false;
      touchStartRef.current = null;
      isHorizontalSwipeRef.current = null;
      isBackTriggeredRef.current = false;
    };
  }, []);

  /**
   * Bắt đầu chạm: Chỉ kích hoạt nếu chạm vào mép cạnh trái màn hình
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!enabled || isBackTriggeredRef.current) return;
      const touch = e.touches[0];

      // Chỉ bắt cử chỉ khi vị trí chạm đầu tiên nằm trong phạm vi mép trái
      if (touch.clientX <= edgeWidth) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        };
        isTrackingRef.current = true;
        isHorizontalSwipeRef.current = null;

        // Xóa bỏ transition trước đó để dịch chuyển theo tay ngay lập tức
        if (containerRef.current) {
          containerRef.current.style.transition = 'none';
        }
      } else {
        touchStartRef.current = null;
        isTrackingRef.current = false;
        isHorizontalSwipeRef.current = null;
      }
    },
    [enabled, edgeWidth]
  );

  /**
   * Di chuyển ngón tay: Theo dõi khoảng cách và cập nhật vị trí thời gian thực
   */
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTrackingRef.current || !touchStartRef.current || isBackTriggeredRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Xác định hướng vuốt trong 8-10px đầu tiên
    if (isHorizontalSwipeRef.current === null) {
      if (deltaX > 8 && deltaX > deltaY * 1.4) {
        // Xác nhận là vuốt ngang sang phải
        isHorizontalSwipeRef.current = true;
      } else if (deltaY > 8) {
        // Người dùng đang cuộn dọc nội dung trang -> Hủy gesture này ngay để cuộn mượt
        isTrackingRef.current = false;
        return;
      }
    }

    // Nếu đã xác nhận là vuốt ngang sang phải
    if (isHorizontalSwipeRef.current && deltaX > 0 && containerRef.current) {
      // Dùng Direct DOM Ref style transform để tránh kích hoạt re-render React
      containerRef.current.style.transform = `translateX(${deltaX}px)`;
      // Hiệu ứng bóng đổ cạnh trái mô phỏng độ nổi của trang theo phong cách iOS
      const shadowAlpha = Math.min(0.2, (deltaX / 200) * 0.2);
      containerRef.current.style.boxShadow = `-14px 0 28px rgba(0, 0, 0, ${shadowAlpha})`;
    }
  }, []);

  /**
   * Nhấc ngón tay: Tính toán vận tốc (flick) hoặc quãng đường để quyết định Back hay Snap lại
   */
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isTrackingRef.current || !touchStartRef.current || isBackTriggeredRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const velocityX = deltaX / Math.max(deltaTime, 1); // px trên ms
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

      // Quyết định quay lại: Nếu kéo qua 30% chiều rộng màn hình HOẶC vẩy nhanh sang phải (vx > 0.42)
      const shouldBack =
        isHorizontalSwipeRef.current &&
        deltaX > 0 &&
        (deltaX > screenWidth * 0.3 || velocityX > 0.42);

      if (shouldBack && containerRef.current) {
        isBackTriggeredRef.current = true;

        // Trượt hẳn ra khỏi mép phải màn hình với gia tốc tự nhiên
        containerRef.current.style.transition =
          'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.22s ease';
        containerRef.current.style.transform = `translateX(${screenWidth}px)`;
        containerRef.current.style.boxShadow = '-16px 0 32px rgba(0, 0, 0, 0.15)';

        // Rung Haptic phản hồi nhẹ trên các thiết bị hỗ trợ
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(12);
        }

        // Kích hoạt callback onBack sau khi animation kết thúc
        setTimeout(() => {
          onBack();
        }, 200);
      } else if (containerRef.current) {
        // Snap trở lại vị trí ban đầu nếu chưa đạt ngưỡng
        containerRef.current.style.transition =
          'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease';
        containerRef.current.style.transform = 'translateX(0px)';
        containerRef.current.style.boxShadow = 'none';
      }

      isTrackingRef.current = false;
      touchStartRef.current = null;
      isHorizontalSwipeRef.current = null;
    },
    [onBack]
  );

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn('w-full min-h-full will-change-transform', className)}
    >
      {children}
    </div>
  );
};
