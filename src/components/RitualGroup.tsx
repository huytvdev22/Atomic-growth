import React from 'react';
import { RitualTime, Habit } from '../types/habit';
import { HabitCard } from './HabitCard';
import { Sunrise, Compass, Moon } from 'lucide-react';

interface RitualGroupProps {
  ritual: RitualTime;
  habits: Habit[];
  onAddHabitClick: (defaultRitual: RitualTime) => void;
}

export const RitualGroup: React.FC<RitualGroupProps> = ({ ritual, habits, onAddHabitClick }) => {
  const meta = {
    morning: {
      icon: <Sunrise className="w-5 h-5 text-accent-amber" />,
      title: 'Nghi thức Rạng Đông',
      subtitle: 'Đánh thức thân tâm & chuẩn bị năng lượng tích cực'
    },
    midday: {
      icon: <Compass className="w-5 h-5 text-accent-sage" />,
      title: 'Khối Tập Trung & Phát Triển',
      subtitle: 'Hành động sâu sắc trong học tập, công việc & sức khỏe'
    },
    evening: {
      icon: <Moon className="w-5 h-5 text-primary" />,
      title: 'Lắng Đọng & Phản Tư',
      subtitle: 'Xả hơi, ghi chép biết ơn & phục hồi sau ngày dài'
    }
  }[ritual];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-subtle border border-border">
            {meta.icon}
          </div>
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-text-primary">
              {meta.title}
            </h2>
            <p className="text-xs text-text-secondary hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <span className="font-mono text-xs text-text-tertiary bg-surface px-2.5 py-0.5 rounded-full border border-border">
          {habits.length} Thói quen
        </span>
      </div>

      <div className="space-y-2.5">
        {habits.length > 0 ? (
          habits.map(habit => <HabitCard key={habit.id} habit={habit} />)
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface/50 p-6 text-center">
            <p className="text-xs sm:text-sm text-text-secondary">
              Chưa có thói quen nào trong khối này.
            </p>
            <button
              onClick={() => onAddHabitClick(ritual)}
              className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              + Thêm thói quen đầu tiên
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
