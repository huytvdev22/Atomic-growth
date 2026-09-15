import React from 'react';
import { Habit } from '../types/habit';
import { useHabits } from '../context/HabitContext';
import { Check, Flame, Trash2, Zap, Brain } from 'lucide-react';
import { cn } from '../utils/cn';

interface HabitCardProps {
  habit: Habit;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { isHabitCompletedToday, toggleHabit, deleteHabit, setActiveTab } = useHabits();
  const completed = isHabitCompletedToday(habit.id);

  const isFlashcardHabit =
    habit.title.toLowerCase().includes('thẻ') ||
    habit.title.toLowerCase().includes('anki') ||
    habit.title.toLowerCase().includes('từ vựng');

  // Nhãn danh mục tiếng Việt
  const categoryLabels: Record<string, string> = {
    health: 'Sức khỏe',
    mind: 'Tâm trí',
    focus: 'Trí tuệ',
    gratitude: 'Biết ơn'
  };

  return (
    <div
      onClick={() => toggleHabit(habit.id)}
      className={cn(
        'group relative flex items-center justify-between gap-3.5 rounded-md p-4 sm:px-5 sm:py-4.5 border transition-all duration-200 cursor-pointer select-none',
        completed
          ? 'bg-surface-soft border-[#DDEBE3] opacity-85'
          : 'bg-surface border-border hover:border-accent-sage hover:-translate-y-0.5 shadow-[0_2px_12px_-4px_rgba(28,38,33,0.04)]'
      )}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        {/* Vòng tròn Check-in */}
        <button
          type="button"
          aria-label={completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            completed
              ? 'bg-primary border-primary text-white shadow-xs'
              : 'border-border bg-surface group-hover:border-accent-sage text-transparent'
          )}
        >
          <Check
            className={cn(
              'h-4 w-4 stroke-[3] transition-transform duration-200',
              completed ? 'scale-100 animate-spring' : 'scale-50 opacity-0'
            )}
          />
        </button>

        {/* Thông tin thói quen */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            className={cn(
              'font-sans text-sm sm:text-[0.96rem] font-semibold transition-colors duration-200 truncate',
              completed ? 'line-through text-text-tertiary' : 'text-text-primary'
            )}
          >
            {habit.title}
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span className="rounded-xs bg-canvas-subtle px-2 py-0.5 font-semibold text-[11px] text-text-secondary">
              {categoryLabels[habit.category] || habit.category}
            </span>

            {habit.twoMinuteVersion && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-accent-clay">
                <Zap className="w-3 h-3" />
                <span>2-phút: {habit.twoMinuteVersion}</span>
              </span>
            )}

            {isFlashcardHabit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('flashcards');
                }}
                className="inline-flex items-center gap-1 rounded-xs bg-accent-sprout/70 px-2 py-0.5 font-semibold text-[11px] text-primary hover:bg-accent-sprout transition-colors cursor-pointer"
                title="Mở Góc Ôn Tập Thẻ Nhớ"
              >
                <Brain className="w-3 h-3" />
                <span>Ôn thẻ 2m</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cột chuỗi ngày kiên trì (Streak) & Nút xóa khi hover */}
      <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div
          className={cn(
            'inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-sm border transition-colors',
            habit.currentStreak > 0
              ? 'bg-[#FEF6EC] text-accent-amber border-[#FCE4C8]'
              : 'bg-canvas-subtle text-text-tertiary border-border'
          )}
        >
          <Flame className={cn('w-3.5 h-3.5', habit.currentStreak > 0 ? 'fill-accent-amber' : '')} />
          <span>{habit.currentStreak}d</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Bạn có chắc chắn muốn xóa thói quen "${habit.title}"?`)) {
              deleteHabit(habit.id);
            }
          }}
          className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-error transition-all p-1 rounded hover:bg-canvas-subtle"
          title="Xóa thói quen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
