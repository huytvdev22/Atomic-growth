import React from 'react';
import { Calendar, Brain, Plus, BookOpen, Sprout } from 'lucide-react';
import { cn } from '../utils/cn';

export interface BottomNavProps {
  /** Tab đang hoạt động trong HabitContext */
  activeTab: 'timeline' | 'reflections' | 'flashcards' | 'anki-decoder' | 'archive' | 'dashboard';
  /** Callback chuyển tab khi người dùng chạm vào */
  onSelectTab: (tab: 'timeline' | 'reflections' | 'flashcards' | 'anki-decoder' | 'archive' | 'dashboard') => void;
  /** Callback mở modal gieo mầm thói quen mới khi chạm nút (+) ở trung tâm */
  onOpenAddModal: () => void;
  /** Số lượng thẻ Anki cần ôn hôm nay (nếu có để hiển thị badge) */
  dueCardsCount?: number;
}

/**
 * Thanh Điều Hướng Đáy Zen (Modern Botanical Zen Bottom Navigation Bar)
 * Thiết kế tối ưu cho thao tác 1 tay (One-Handed Thumb Zone) trên thiết bị di động.
 * Kế thừa phong cách Elera SaaS: Kính mờ backdrop-blur, bo góc mềm mại, an toàn với Safe Area.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  dueCardsCount
}) => {
  return (
    <nav
      aria-label="Thanh điều hướng đáy di động"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/92 backdrop-blur-lg border-t border-border/80 shadow-[0_-4px_20px_rgba(25,36,30,0.06)] pb-safe select-none"
    >
      <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto relative">
        {/* 1. Tab Dòng Thời Gian (Hôm nay) */}
        <button
          type="button"
          onClick={() => onSelectTab('timeline')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 cursor-pointer group',
            activeTab === 'timeline'
              ? 'text-[#144919]'
              : 'text-text-tertiary hover:text-text-primary active:scale-95'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
              activeTab === 'timeline'
                ? 'bg-accent-sprout/25 shadow-2xs'
                : 'group-hover:bg-canvas-subtle'
            )}
          >
            <Calendar
              className={cn(
                'w-4.5 h-4.5 transition-transform duration-200',
                activeTab === 'timeline' ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
              )}
            />
          </div>
          <span
            className={cn(
              'text-[10px] font-sans tracking-tight mt-0.5',
              activeTab === 'timeline' ? 'font-bold text-[#144919]' : 'font-medium'
            )}
          >
            Hôm nay
          </span>
        </button>

        {/* 2. Tab Góc Ôn Tập Thẻ Nhớ (Anki) */}
        <button
          type="button"
          onClick={() => onSelectTab('flashcards')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 cursor-pointer group relative',
            activeTab === 'flashcards' || activeTab === 'anki-decoder'
              ? 'text-[#144919]'
              : 'text-text-tertiary hover:text-text-primary active:scale-95'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 relative',
              activeTab === 'flashcards' || activeTab === 'anki-decoder'
                ? 'bg-accent-sprout/25 shadow-2xs'
                : 'group-hover:bg-canvas-subtle'
            )}
          >
            <Brain
              className={cn(
                'w-4.5 h-4.5 transition-transform duration-200',
                activeTab === 'flashcards' || activeTab === 'anki-decoder'
                  ? 'stroke-[2.5] scale-105'
                  : 'stroke-[1.8]'
              )}
            />
            {/* Huy hiệu phiên 2m hoặc số thẻ cần ôn */}
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-semantic-sky text-[9px] font-mono font-bold text-white px-1 shadow-2xs">
              {dueCardsCount && dueCardsCount > 0 ? dueCardsCount : '2m'}
            </span>
          </div>
          <span
            className={cn(
              'text-[10px] font-sans tracking-tight mt-0.5',
              activeTab === 'flashcards' || activeTab === 'anki-decoder'
                ? 'font-bold text-[#144919]'
                : 'font-medium'
            )}
          >
            Ôn tập
          </span>
        </button>

        {/* 3. Nút Hành Động Trung Tâm (+) — Gieo Mầm Nhanh 1 Chạm */}
        <div className="flex flex-col items-center justify-center px-1 shrink-0 -mt-5">
          <button
            type="button"
            onClick={onOpenAddModal}
            aria-label="Gieo mầm thói quen mới"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#19241E] text-white shadow-[0_8px_20px_rgba(25,36,30,0.25)] hover:bg-primary-hover active:scale-90 transition-all duration-200 cursor-pointer border-[3px] border-surface ring-1 ring-border/40"
          >
            <Plus className="w-5 h-5 stroke-[2.6]" />
          </button>
          <span className="text-[9px] font-sans font-semibold text-text-secondary tracking-tight mt-0.5">
            Gieo mầm
          </span>
        </div>

        {/* 4. Tab Nhật Ký Phản Tư */}
        <button
          type="button"
          onClick={() => onSelectTab('reflections')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 cursor-pointer group',
            activeTab === 'reflections'
              ? 'text-[#144919]'
              : 'text-text-tertiary hover:text-text-primary active:scale-95'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
              activeTab === 'reflections'
                ? 'bg-accent-sprout/25 shadow-2xs'
                : 'group-hover:bg-canvas-subtle'
            )}
          >
            <BookOpen
              className={cn(
                'w-4.5 h-4.5 transition-transform duration-200',
                activeTab === 'reflections' ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
              )}
            />
          </div>
          <span
            className={cn(
              'text-[10px] font-sans tracking-tight mt-0.5',
              activeTab === 'reflections' ? 'font-bold text-[#144919]' : 'font-medium'
            )}
          >
            Phản tư
          </span>
        </button>

        {/* 5. Tab Khu Vườn (Dashboard Sinh Trưởng Toàn Diện) */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 cursor-pointer group',
            activeTab === 'dashboard'
              ? 'text-[#144919]'
              : 'text-text-tertiary hover:text-text-primary active:scale-95'
          )}
          title="Bảng điều khiển Khu vườn & Ma trận sinh trưởng"
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
              activeTab === 'dashboard'
                ? 'bg-accent-sprout/25 shadow-2xs'
                : 'group-hover:bg-canvas-subtle'
            )}
          >
            <Sprout
              className={cn(
                'w-4.5 h-4.5 transition-transform duration-200',
                activeTab === 'dashboard' ? 'stroke-[2.5] scale-105 text-[#144919]' : 'stroke-[1.8]'
              )}
            />
          </div>
          <span
            className={cn(
              'text-[10px] font-sans tracking-tight mt-0.5',
              activeTab === 'dashboard' ? 'font-bold text-[#144919]' : 'font-medium'
            )}
          >
            Khu vườn
          </span>
        </button>
      </div>
    </nav>
  );
};
