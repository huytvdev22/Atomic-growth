import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useHabits } from '../context/HabitContext';
import { RitualTime, HabitCategory } from '../types/habit';
import { Sparkles, Zap, Sunrise, Compass, Moon } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRitual?: RitualTime;
}

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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Gieo Mầm Thói Quen Mới">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Ví dụ: Đọc 10 trang sách, Chạy bộ 3km..."
            className="w-full rounded-md border border-border bg-canvas px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
          />
        </div>

        {/* Khẳng định bản sắc */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bản sắc gắn liền (Identity-First)</span>
          </div>
          <input
            type="text"
            value={identityPrompt}
            onChange={(e) => setIdentityPrompt(e.target.value)}
            placeholder="Ví dụ: Tôi là một người học tập suốt đời..."
            className="w-full rounded-md border border-border bg-canvas px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
          />
        </div>

        {/* Quy tắc 2 phút */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-clay mb-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Phiên bản 2 phút (Make it Easy)</span>
          </div>
          <input
            type="text"
            value={twoMinuteVersion}
            onChange={(e) => setTwoMinuteVersion(e.target.value)}
            placeholder="Ví dụ: Chỉ mở sách ra đọc 1 trang..."
            className="w-full rounded-md border border-border bg-canvas px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-sage/20"
          />
        </div>

        {/* Chọn Khối thời gian (Ritual) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
            Khối thời gian thực hiện
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'morning', label: 'Rạng Đông', icon: <Sunrise className="w-3.5 h-3.5 inline mr-1" /> },
              { id: 'midday', label: 'Tập Trung', icon: <Compass className="w-3.5 h-3.5 inline mr-1" /> },
              { id: 'evening', label: 'Lắng Đọng', icon: <Moon className="w-3.5 h-3.5 inline mr-1" /> }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRitual(item.id as RitualTime)}
                className={`py-2 text-xs font-semibold rounded-md border transition-all flex items-center justify-center ${
                  ritual === item.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-canvas-subtle text-text-secondary border-border hover:bg-canvas'
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
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id as HabitCategory)}
                className={`py-2 text-xs font-semibold rounded-md border transition-all ${
                  category === item.id
                    ? 'bg-accent-sage text-white border-accent-sage shadow-xs'
                    : 'bg-canvas-subtle text-text-secondary border-border hover:bg-canvas'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover active:scale-[0.99] transition-all"
          >
            Bắt Đầu Nuôi Dưỡng Thói Quen Này
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
