import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { generateGardenHeatmap, calculateGardenActiveStreak } from '../utils/habitCalculations';
import { Flame, Sprout } from 'lucide-react';

/**
 * Component Tổng Quan Tiến Độ & Khu Vườn Kiên Trì (Garden Heatmap)
 * Bo góc 16px, vòng tròn tiến độ xanh mầm tươi và ma trận 14 ngày chuẩn Elera
 */
export const GrowthOverview: React.FC = () => {
  const { logs, completionRate, completedTodayCount, totalActiveHabits } = useHabits();

  // Bán kính và chu vi vòng tròn SVG
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // ~201.06
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  // Tính chuỗi ngày kiên trì thực tế của Khu Vườn từ lịch sử logs
  const gardenStreak = useMemo(() => {
    return calculateGardenActiveStreak(logs);
  }, [logs]);

  // Sinh danh sách 14 ô vuông ma trận
  const heatmapCells = useMemo(() => {
    return generateGardenHeatmap(logs, totalActiveHabits, 14);
  }, [logs, totalActiveHabits]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4">
      {/* Thẻ Vòng Tiến Độ Sinh Trưởng */}
      <div className="flex flex-col justify-between rounded-2xl bg-surface p-5 border border-border shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Hôm Nay
          </span>
          <span className="text-xs font-mono font-medium text-text-tertiary">
            {completedTodayCount} / {totalActiveHabits} Đạt
          </span>
        </div>

        <div className="flex items-center gap-4.5 my-2">
          <div className="relative flex items-center justify-center">
            <svg className="w-18 h-18 -rotate-90" viewBox="0 0 80 80">
              {/* Rãnh nền */}
              <circle
                className="text-canvas-subtle"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="40"
                cy="40"
              />
              {/* Vòng lấp đầy xanh mầm tươi */}
              <circle
                className="text-accent-sprout transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="40"
                cy="40"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <Sprout className="w-5 h-5 text-accent-sprout" />
            </div>
          </div>

          <div>
            <div className="font-mono text-2xl font-bold text-accent-sprout">
              {completionRate}%
            </div>
            <div className="text-xs text-text-secondary font-medium">
              Mầm sinh trưởng
            </div>
          </div>
        </div>
      </div>

      {/* Thẻ Khu Vườn Kiên Trì (Garden Heatmap) */}
      <div className="rounded-2xl bg-surface p-5 border border-border shadow-card">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-xs font-bold text-text-primary">
            Khu vườn kiên trì (14 ngày qua)
          </div>
          <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold bg-semantic-amber-bg text-semantic-amber px-2.5 py-0.5 rounded-full border border-semantic-amber/30">
            <Flame className="w-3.5 h-3.5 fill-semantic-amber" />
            <span>{gardenStreak} Ngày liên tục</span>
          </div>
        </div>

        {/* Lưới 14 ô vuông */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
          {heatmapCells.map((cell, idx) => {
            // Sắc thái xanh Botanical Zen theo cấp độ
            const levelClasses = {
              0: 'bg-canvas-subtle hover:border-border',
              1: 'bg-[#D2E7DC] hover:border-accent-sprout',
              2: 'bg-[#96CBB0] hover:border-accent-sprout',
              3: 'bg-[#6DC85A] hover:border-[#144919]',
              4: 'bg-primary hover:border-primary-hover shadow-xs'
            }[cell.level];

            return (
              <div
                key={idx}
                className={`aspect-square rounded-sm transition-transform duration-150 cursor-pointer hover:scale-125 border border-transparent ${levelClasses} ${
                  cell.isToday ? 'ring-2 ring-semantic-amber ring-offset-1' : ''
                }`}
                title={`${cell.date}: Hoàn thành ${cell.completedCount}/${cell.totalHabits} thói quen ${
                  cell.isToday ? '(Hôm nay)' : ''
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-tertiary mt-3 pt-1 border-t border-border-subtle">
          <span>14 ngày trước</span>
          <div className="flex items-center gap-1">
            <span>Ít</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[#D2E7DC]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#96CBB0]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#6DC85A]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-primary" />
            <span>Nhiều</span>
          </div>
          <span>Hôm nay</span>
        </div>
      </div>
    </div>
  );
};
