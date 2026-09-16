import React, { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { RitualTime } from '../types/habit';
import { Send, Hash, Sunrise, Compass, Moon, Sparkles, Heart, Shield, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Zen Daily Reflection Shell & Quick Jot Box
 * Lấy cảm hứng từ màn hình Elera AI Chat:
 * - Lời chào theo buổi trong ngày trang nhã
 * - 4 Prompt Pills suy ngẫm nhanh 1 chạm
 * - Ô nhập liệu bo góc 18px với cảm giác viết tập trung
 */
export const QuickJotBox: React.FC = () => {
  const { addNote } = useHabits();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('gratitude');
  const [selectedRitual, setSelectedRitual] = useState<RitualTime>('morning');
  const [showTagSelector, setShowTagSelector] = useState(false);

  // Lời chào theo buổi trong ngày
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.displayName ? user.displayName.split(' ')[0] : 'bạn';
    if (hour >= 4 && hour < 12) return `Chào buổi sáng, ${name}`;
    if (hour >= 12 && hour < 18) return `Buổi chiều an yên, ${name}`;
    return `Buổi tối tĩnh lặng, ${name}`;
  }, [user]);

  // 4 Prompt Pills suy ngẫm hành vi (Elera Quick Prompts)
  const promptPills = [
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-accent-sprout" />,
      text: 'Thói quen nào mang lại năng lượng nhất hôm nay?',
      tag: 'mind'
    },
    {
      icon: <Zap className="w-3.5 h-3.5 text-semantic-terracotta" />,
      text: 'Quy tắc 2 phút hôm nay đã giúp ích gì?',
      tag: 'focus'
    },
    {
      icon: <Shield className="w-3.5 h-3.5 text-semantic-sky" />,
      text: 'Rào cản nào khiến tôi suýt bỏ lỡ nhịp sinh trưởng?',
      tag: 'health'
    },
    {
      icon: <Heart className="w-3.5 h-3.5 text-semantic-amber" />,
      text: 'Một điều tôi cảm thấy biết ơn sâu sắc hôm nay là...',
      tag: 'gratitude'
    }
  ];

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

  const handleApplyPrompt = (promptText: string, tag: string) => {
    setContent(promptText + ' ');
    setSelectedTag(tag);
  };

  return (
    <div className="space-y-4">
      {/* Lời chào trang nhã phong cách Elera Chat */}
      <div className="text-center py-2 space-y-1">
        <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          {greeting}
        </h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto">
          Dành 2 phút lắng đọng để ghi nhận những chuyển hóa nội tâm và bài học nhỏ của bạn.
        </p>
      </div>

      {/* 4 Prompt Pills Gợi Ý Nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {promptPills.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleApplyPrompt(p.text, p.tag)}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface border border-border/80 hover:border-accent-sprout/60 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover transition-all text-left cursor-pointer group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-canvas-subtle group-hover:bg-accent-sprout-soft transition-colors border border-border/40">
              {p.icon}
            </div>
            <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors line-clamp-1">
              {p.text}
            </span>
          </button>
        ))}
      </div>

      {/* Khung Nhập Phản Tư Quick Jot Box */}
      <div className="rounded-2xl bg-surface border border-border p-4 sm:p-5 shadow-card focus-within:border-accent-sprout focus-within:ring-2 focus-within:ring-accent-sprout/15 transition-all">
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
            {/* Nút chọn Tag dạng Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer',
                  selectedTag
                    ? 'bg-accent-sprout-soft text-[#144919] border-accent-sprout/30 font-semibold'
                    : 'bg-canvas-subtle text-text-secondary border-border hover:bg-canvas'
                )}
              >
                <Hash className="w-3.5 h-3.5 text-text-tertiary" />
                <span>{tags.find((t) => t.id === selectedTag)?.label || 'Chọn Tag'}</span>
              </button>

              {showTagSelector && (
                <div className="absolute top-full left-0 mt-1.5 z-30 w-36 rounded-2xl bg-surface border border-border shadow-xl p-1.5 space-y-0.5 animate-in fade-in">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTag(t.id);
                        setShowTagSelector(false);
                      }}
                      className={cn(
                        'w-full text-left text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer',
                        selectedTag === t.id
                          ? 'bg-accent-sprout-soft font-bold text-[#144919]'
                          : 'text-text-secondary hover:bg-canvas-subtle hover:text-text-primary'
                      )}
                    >
                      #{t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chọn Nhịp sinh học Pill Group */}
            <div className="flex items-center bg-canvas-subtle p-1 rounded-full border border-border/80">
              <button
                type="button"
                onClick={() => setSelectedRitual('morning')}
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  selectedRitual === 'morning'
                    ? 'bg-surface text-semantic-amber shadow-2xs'
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
                title="Rạng Đông"
              >
                <Sunrise className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedRitual('midday')}
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  selectedRitual === 'midday'
                    ? 'bg-surface text-accent-sage shadow-2xs'
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
                title="Tập Trung"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedRitual('evening')}
                className={cn(
                  'p-1.5 rounded-full transition-colors cursor-pointer',
                  selectedRitual === 'evening'
                    ? 'bg-surface text-primary shadow-2xs'
                    : 'text-text-tertiary hover:text-text-secondary'
                )}
                title="Lắng Đọng"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Nút gửi (Send button) dạng Pill than sẫm */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!content.trim()}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-all',
              content.trim()
                ? 'bg-[#19241E] text-white shadow-xs hover:bg-primary-hover active:scale-95 cursor-pointer'
                : 'bg-canvas-subtle text-text-tertiary cursor-not-allowed opacity-50'
            )}
            title="Lưu phản tư"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
