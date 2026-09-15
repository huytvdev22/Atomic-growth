import React from 'react';
import { MemoryVitality } from '../../types/anki';
import { cn } from '../../utils/cn';

interface MemoryStrengthIndicatorProps {
  vitality: MemoryVitality;
  showLabel?: boolean;
  className?: string;
}

/**
 * Thước đo mức độ ghi nhớ 3 vạch (Memory Strength Indicator)
 * Lấy cảm hứng từ thiết kế tối giản của Mural kết hợp bảng màu Botanical Zen:
 * - 1 vạch: Fragile (Hạt mầm mong manh - màu đất nung Terracotta)
 * - 2 vạch: Growing (Đang sinh trưởng - màu xanh xô thơm Sage)
 * - 3 vạch: Steady (Rễ sâu vững chắc - màu bách sẫm Cypress)
 */
export const MemoryStrengthIndicator: React.FC<MemoryStrengthIndicatorProps> = ({
  vitality,
  showLabel = true,
  className
}) => {
  // Cấu hình số vạch kích hoạt và nhãn theo cấp độ
  const config = {
    fragile: {
      activeBars: 1,
      label: 'Fragile',
      subtext: 'Mong manh',
      colorClass: 'bg-accent-clay text-accent-clay'
    },
    growing: {
      activeBars: 2,
      label: 'Growing',
      subtext: 'Đang lớn',
      colorClass: 'bg-accent-sage text-accent-sage'
    },
    steady: {
      activeBars: 3,
      label: 'Steady',
      subtext: 'Vững chắc',
      colorClass: 'bg-primary text-primary'
    }
  }[vitality];

  return (
    <div className={cn('flex flex-col items-end gap-1 select-none', className)}>
      {/* 3 Vạch ngang trực quan */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((bar) => {
          const isActive = bar <= config.activeBars;
          return (
            <div
              key={bar}
              className={cn(
                'h-1.5 w-3.5 sm:w-4 rounded-full transition-all duration-300',
                isActive ? config.colorClass.split(' ')[0] : 'bg-border/60'
              )}
            />
          );
        })}
      </div>

      {/* Nhãn chữ nhỏ thanh lịch */}
      {showLabel && (
        <span
          className={cn(
            'text-[10px] sm:text-[11px] font-mono font-medium tracking-tight',
            config.colorClass.split(' ')[1]
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  );
};
