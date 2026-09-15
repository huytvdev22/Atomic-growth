import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { RitualTime } from '../types/habit';
import { Send, Hash, Sunrise, Compass, Moon } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Khung Nhập Phản Tư Vi Mô Nhanh (Flomo / FlareMo Jot Box)
 * Giúp người dùng ghi nhanh 1 suy ngẫm, bài học hoặc lời biết ơn gắn với thói quen
 */
export const QuickJotBox: React.FC = () => {
  const { addNote } = useHabits();
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('gratitude');
  const [selectedRitual, setSelectedRitual] = useState<RitualTime>('morning');
  const [showTagSelector, setShowTagSelector] = useState(false);

  const tags = [
    { id: 'health', label: 'Sức-khỏe' },
    { id: 'mind', label: 'Tâm-trí' },
    { id: 'focus', label: 'Trí-tuệ' },
    { id: 'gratitude', label: 'Biết-ơn' }
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    addNote(content.trim(), selectedTag, selectedRitual);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-lg bg-surface border border-border p-4 sm:p-5 shadow-[0_2px_14px_-4px_rgba(28,38,33,0.04)] focus-within:border-accent-sage transition-all">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Hôm nay bạn đã vun bồi bản sắc gì? Hãy ghi lại một suy ngẫm, bài học hay điều biết ơn... (Ctrl + Enter để gửi)"
        rows={3}
        className="w-full bg-transparent text-sm sm:text-[0.95rem] text-text-primary placeholder:text-text-tertiary focus:outline-none resize-none leading-relaxed font-sans"
      />

      {/* Thanh công cụ bên dưới */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle mt-2">
        <div className="flex items-center gap-2">
          {/* Nút chọn Tag */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTagSelector(!showTagSelector)}
              className={cn(
                'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors',
                selectedTag
                  ? 'bg-accent-sprout text-primary border-accent-sage/40 font-semibold'
                  : 'bg-canvas-subtle text-text-secondary border-border hover:bg-canvas'
              )}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{tags.find(t => t.id === selectedTag)?.label || 'Chọn Tag'}</span>
            </button>

            {showTagSelector && (
              <div className="absolute top-full left-0 mt-1.5 z-30 w-36 rounded-md bg-surface border border-border shadow-lg p-1 space-y-0.5">
                {tags.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTag(t.id);
                      setShowTagSelector(false);
                    }}
                    className={cn(
                      'w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors',
                      selectedTag === t.id
                        ? 'bg-accent-sprout font-bold text-primary'
                        : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
                    )}
                  >
                    #{t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chọn Nhịp sinh học */}
          <div className="flex items-center bg-canvas-subtle p-0.5 rounded-md border border-border">
            <button
              type="button"
              onClick={() => setSelectedRitual('morning')}
              className={cn(
                'p-1 rounded transition-colors',
                selectedRitual === 'morning' ? 'bg-surface text-accent-amber shadow-2xs' : 'text-text-tertiary hover:text-text-secondary'
              )}
              title="Buổi sáng"
            >
              <Sunrise className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedRitual('midday')}
              className={cn(
                'p-1 rounded transition-colors',
                selectedRitual === 'midday' ? 'bg-surface text-accent-sage shadow-2xs' : 'text-text-tertiary hover:text-text-secondary'
              )}
              title="Buổi chiều"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedRitual('evening')}
              className={cn(
                'p-1 rounded transition-colors',
                selectedRitual === 'evening' ? 'bg-surface text-primary shadow-2xs' : 'text-text-tertiary hover:text-text-secondary'
              )}
              title="Buổi tối"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Nút gửi (Send button) */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!content.trim()}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-all',
            content.trim()
              ? 'bg-primary text-white shadow-xs hover:bg-primary-hover active:scale-95 cursor-pointer'
              : 'bg-canvas-subtle text-text-tertiary cursor-not-allowed opacity-60'
          )}
          title="Lưu phản tư"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
