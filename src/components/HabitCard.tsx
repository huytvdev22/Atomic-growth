import React from 'react';
import { Habit } from '../types/habit';
import { useHabits } from '../context/HabitContext';
import { calculateEffectiveHabitStreak } from '../utils/habitCalculations';
import { Check, Flame, Trash2, Zap, Brain, Play } from 'lucide-react';
import { cn } from '../utils/cn';

interface HabitCardProps {
  habit: Habit;
}

/**
 * Thẻ Thói Quen Chuẩn Elera (Refined Habit Card)
 * Thiết kế phẳng tinh khiết, bo góc 16px, nút check-in 1 chạm xanh mầm tươi mượt mà
 */
export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { isHabitCompletedToday, toggleHabit, deleteHabit, setActiveTab, startDeckReview } = useHabits();
  const completed = isHabitCompletedToday(habit.id);
  const effectiveStreak = calculateEffectiveHabitStreak(habit);

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
        'group relative flex items-center justify-between gap-3.5 rounded-2xl p-3.5 sm:px-4.5 sm:py-4 border transition-all duration-200 cursor-pointer select-none',
        completed
          ? 'bg-surface-soft/90 border-[#DDE7E1] opacity-85 shadow-none'
          : 'bg-surface border-border hover:border-accent-sprout/60 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover'
      )}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        {/* Vòng tròn Check-in 1 chạm xanh mầm tươi */}
        <button
          type="button"
          aria-label={completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer',
            completed
              ? 'bg-accent-sprout border-accent-sprout text-white shadow-xs'
              : 'border-border/80 bg-surface group-hover:border-accent-sprout text-transparent'
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
              'font-sans text-sm sm:text-[0.95rem] font-semibold transition-colors duration-200 truncate',
              completed ? 'line-through text-text-tertiary font-normal' : 'text-text-primary'
            )}
          >
            {habit.title}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Tag Danh mục Pill */}
            <span className="rounded-full bg-canvas-subtle px-2.5 py-0.5 font-medium text-[11px] text-text-secondary border border-border/40">
              {categoryLabels[habit.category] || habit.category}
            </span>

            {/* Quy tắc 2 phút */}
            {habit.twoMinuteVersion && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-semantic-terracotta-bg text-semantic-terracotta px-2.5 py-0.5 text-[11px] font-medium border border-semantic-terracotta/20">
                <Zap className="w-3 h-3" />
                <span>2m: {habit.twoMinuteVersion}</span>
              </span>
            )}

            {/* Phím tắt mở ôn bộ thẻ liên kết hoặc mở tab thẻ nhớ */}
            {habit.linkedDeckId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startDeckReview(habit.linkedDeckId!);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-accent-sprout/20 text-[#144919] hover:bg-accent-sprout/30 px-2.5 py-0.5 font-semibold text-[11px] border border-accent-sprout/40 transition-all cursor-pointer shadow-2xs group/btn"
                title="Bắt đầu ngay phiên ôn tập 2 phút cho bộ thẻ này"
              >
                <Brain className="w-3 h-3 text-accent-sage shrink-0 group-hover/btn:scale-110 transition-transform" />
                <span>Ôn 2p</span>
                <Play className="w-2.5 h-2.5 fill-current opacity-80 shrink-0 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            ) : isFlashcardHabit ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('flashcards');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-semantic-sky-bg text-semantic-sky px-2.5 py-0.5 font-medium text-[11px] hover:bg-semantic-sky-bg/80 border border-semantic-sky/20 transition-colors cursor-pointer"
                title="Mở Góc Ôn Tập Thẻ Nhớ"
              >
                <Brain className="w-3 h-3" />
                <span>Ôn thẻ 2m</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Cột chuỗi ngày kiên trì (Streak Pill) & Nút xóa khi hover */}
      <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div
          className={cn(
            'inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors',
            effectiveStreak > 0
              ? 'bg-semantic-amber-bg text-semantic-amber border-semantic-amber/30'
              : 'bg-canvas-subtle text-text-tertiary border-border/60'
          )}
        >
          <Flame className={cn('w-3.5 h-3.5', effectiveStreak > 0 ? 'fill-semantic-amber' : '')} />
          <span>{effectiveStreak}d</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Bạn có chắc chắn muốn xóa thói quen "${habit.title}"?`)) {
              deleteHabit(habit.id);
            }
          }}
          className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-error hover:bg-canvas-subtle transition-all p-1.5 rounded-full cursor-pointer"
          title="Xóa thói quen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
