import React from 'react';
import { RitualTime, Habit } from '../types/habit';
import { HabitCard } from './HabitCard';
import { Sunrise, Compass, Moon, Plus } from 'lucide-react';

interface RitualGroupProps {
  ritual: RitualTime;
  habits: Habit[];
  onAddHabitClick: (defaultRitual: RitualTime) => void;
}

/**
 * Phân Nhóm Thói Quen Theo Nhịp Sinh Học (Ritual Group)
 * Thiết kế thoáng đãng, icon màu chuyên biệt theo buổi trong ngày
 */
export const RitualGroup: React.FC<RitualGroupProps> = ({ ritual, habits, onAddHabitClick }) => {
  const meta = {
    morning: {
      icon: <Sunrise className="w-3.5 h-3.5" />,
      title: 'Rạng Đông',
      colorClass: 'bg-semantic-amber-bg text-semantic-amber border-semantic-amber/20'
    },
    midday: {
      icon: <Compass className="w-3.5 h-3.5" />,
      title: 'Tập Trung',
      colorClass: 'bg-semantic-green-bg text-accent-sage border-semantic-green/20'
    },
    evening: {
      icon: <Moon className="w-3.5 h-3.5" />,
      title: 'Lắng Đọng',
      colorClass: 'bg-[#ECEFF3] text-primary border-border/60'
    }
  }[ritual];

  return (
    <section className="space-y-2.5">
      {/* Header phân nhóm */}
      <div className="flex items-center justify-between py-1 px-1">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${meta.colorClass}`}>
            {meta.icon}
          </div>
          <h2 className="font-sans text-xs sm:text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
            {meta.title}
          </h2>
        </div>

        {habits.length > 0 ? (
          <span className="font-mono text-[11px] font-medium bg-canvas-subtle text-text-secondary px-2.5 py-0.5 rounded-full border border-border/60">
            {habits.length}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAddHabitClick(ritual)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-text-tertiary hover:text-primary hover:bg-canvas-subtle px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm</span>
          </button>
        )}
      </div>

      {/* Danh sách các thẻ thói quen */}
      {habits.length > 0 ? (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      ) : null}
    </section>
  );
};
