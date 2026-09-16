import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useHabits } from '../context/HabitContext';
import { RitualTime, HabitCategory } from '../types/habit';
import { Sparkles, Zap, Sunrise, Compass, Moon, Sprout } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRitual?: RitualTime;
}

/**
 * Modal Thêm Thói Quen (Add Habit Modal)
 * Thiết kế form nhập liệu bo tròn mềm mại chuẩn Elera, tối ưu cho phương pháp James Clear
 */
export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  defaultRitual = 'morning'
}) => {
  const { addHabit } = useHabits();

  const [title, setTitle] = useState('');
  const [identityPrompt, setIdentityPrompt] = useState('');
  const [ritual, setRitual] = useState<RitualTime>(defaultRitual);
  const [category, setCategory] = useState<HabitCategory>('health');
  const [twoMinuteVersion, setTwoMinuteVersion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addHabit({
      title: title.trim(),
      identityPrompt: identityPrompt.trim() || undefined,
      ritual,
      category,
      twoMinuteVersion: twoMinuteVersion.trim() || undefined
    });

    // Reset form
    setTitle('');
    setIdentityPrompt('');
    setTwoMinuteVersion('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Gieo Mầm Thói Quen Mới"
      icon={<Sprout className="w-5 h-5 text-accent-sprout" />}
      subtitle="Thiết kế hành vi bền vững theo Atomic Habits"
    >
      <form onSubmit={handleSubmit} className="space-y-4.5">
        {/* Tên thói quen */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Tên thói quen muốn xây dựng *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Đọc 10 trang sách, Chạy bộ 3km, Thiền định 5 phút..."
            className="w-full rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-sprout focus:outline-none focus:ring-2 focus:ring-accent-sprout/20 transition-all"
          />
        </div>

        {/* Khẳng định bản sắc */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-sprout" />
            <span>Bản sắc gắn liền (Identity-First)</span>
          </div>
          <input
            type="text"
            value={identityPrompt}
            onChange={(e) => setIdentityPrompt(e.target.value)}
            placeholder="Ví dụ: Tôi là một người học tập suốt đời..."
            className="w-full rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-sprout focus:outline-none focus:ring-2 focus:ring-accent-sprout/20 transition-all"
          />
        </div>

        {/* Quy tắc 2 phút */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-semantic-terracotta mb-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Phiên bản 2 phút (Make it Easy)</span>
          </div>
          <input
            type="text"
            value={twoMinuteVersion}
            onChange={(e) => setTwoMinuteVersion(e.target.value)}
            placeholder="Ví dụ: Chỉ mở sách ra đọc 1 trang..."
            className="w-full rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-sprout focus:outline-none focus:ring-2 focus:ring-accent-sprout/20 transition-all"
          />
        </div>

        {/* Chọn Khối thời gian (Ritual) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Khối thời gian thực hiện
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'morning', label: 'Rạng Đông', icon: <Sunrise className="w-3.5 h-3.5 mr-1" /> },
              { id: 'midday', label: 'Tập Trung', icon: <Compass className="w-3.5 h-3.5 mr-1" /> },
              { id: 'evening', label: 'Lắng Đọng', icon: <Moon className="w-3.5 h-3.5 mr-1" /> }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRitual(item.id as RitualTime)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                  ritual === item.id
                    ? 'bg-[#19241E] text-white border-[#19241E] shadow-2xs'
                    : 'bg-canvas-subtle/80 text-text-secondary border-border/80 hover:bg-canvas'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chọn Danh mục */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Danh mục
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'health', label: 'Sức khỏe' },
              { id: 'mind', label: 'Tâm trí' },
              { id: 'focus', label: 'Trí tuệ' },
              { id: 'gratitude', label: 'Biết ơn' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id as HabitCategory)}
                className={`py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  category === item.id
                    ? 'bg-accent-sprout text-[#103813] font-bold border-accent-sprout shadow-2xs'
                    : 'bg-canvas-subtle/80 text-text-secondary border-border/80 hover:bg-canvas'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nút hành động chính dạng Pill */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-full bg-[#19241E] py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer"
          >
            Bắt Đầu Nuôi Dưỡng Thói Quen Này
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
