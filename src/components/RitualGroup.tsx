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
      icon: <Sunrise className="w-4 h-4 text-accent-amber" />,
      title: 'Rạng Đông'
    },
    midday: {
      icon: <Compass className="w-4 h-4 text-accent-sage" />,
      title: 'Tập Trung'
    },
    evening: {
      icon: <Moon className="w-4 h-4 text-primary" />,
      title: 'Lắng Đọng'
    }
  }[ritual];

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          {meta.icon}
          <h2 className="font-sans text-xs sm:text-sm font-semibold text-text-secondary uppercase tracking-wider">
            {meta.title}
          </h2>
        </div>

        {habits.length > 0 ? (
          <span className="font-mono text-[11px] text-text-tertiary">
            {habits.length}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAddHabitClick(ritual)}
            className="text-[11px] text-text-tertiary hover:text-primary transition-colors cursor-pointer"
          >
            + Thêm
          </button>
        )}
      </div>

      {habits.length > 0 ? (
        <div className="space-y-2">
          {habits.map(habit => <HabitCard key={habit.id} habit={habit} />)}
        </div>
      ) : null}
    </section>
  );
};
