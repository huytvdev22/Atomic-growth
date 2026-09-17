import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { useHabits } from '../context/HabitContext';
import { RitualTime, HabitCategory } from '../types/habit';
import { AnkiDeck } from '../types/anki';
import { indexedDbService } from '../services/indexedDbService';
import { Sparkles, Zap, Sunrise, Compass, Moon, Sprout, Layers } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRitual?: RitualTime;
  initialDeckId?: string;
}

/**
 * Modal Thêm Thói Quen (Add Habit Modal)
 * Thiết kế form nhập liệu bo tròn mềm mại chuẩn Botanical Zen, tối ưu cho phương pháp James Clear
 * Hỗ trợ liên kết trực tiếp với Bộ thẻ Flashcard (Anki) kèm gợi ý thông minh
 */
export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  defaultRitual = 'morning',
  initialDeckId
}) => {
  const { addHabit, setActiveTab } = useHabits();

  const [title, setTitle] = useState('');
  const [identityPrompt, setIdentityPrompt] = useState('');
  const [ritual, setRitual] = useState<RitualTime>(defaultRitual);
  const [category, setCategory] = useState<HabitCategory>('health');
  const [twoMinuteVersion, setTwoMinuteVersion] = useState('');

  // Trạng thái liên kết bộ thẻ Flashcard
  const [availableDecks, setAvailableDecks] = useState<AnkiDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckId || '');
  const [deckDailyTarget, setDeckDailyTarget] = useState<number>(5);
  const [autoCheckInOnReview, setAutoCheckInOnReview] = useState<boolean>(true);

  // Tự động điền thông minh theo dữ liệu bộ thẻ
  const applyDeckAutofill = (deck: AnkiDeck) => {
    setTitle((prev) => (!prev.trim() || prev.startsWith('Ôn thẻ:') ? `Ôn thẻ: ${deck.title}` : prev));
    setIdentityPrompt((prev) =>
      !prev.trim() ? 'Tôi là người kiên trì học hỏi và bồi đắp tri thức mỗi ngày' : prev
    );
    setTwoMinuteVersion((prev) => (!prev.trim() ? 'Lật và ôn nhanh 5 thẻ đến hạn đầu tiên' : prev));
    setCategory('focus');
  };

  // Nạp danh sách bộ thẻ từ IndexedDB khi mở modal
  useEffect(() => {
    if (isOpen) {
      indexedDbService.getAllDecks().then((decks) => {
        setAvailableDecks(decks);
        if (initialDeckId) {
          setSelectedDeckId(initialDeckId);
          const matched = decks.find((d) => d.id === initialDeckId);
          if (matched) {
            applyDeckAutofill(matched);
          }
        }
      });
    }
  }, [isOpen, initialDeckId]);

  const handleDeckChange = (deckId: string) => {
    setSelectedDeckId(deckId);
    if (!deckId) return;
    const deck = availableDecks.find((d) => d.id === deckId);
    if (deck) {
      applyDeckAutofill(deck);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addHabit({
      title: title.trim(),
      identityPrompt: identityPrompt.trim() || undefined,
      ritual,
      category,
      twoMinuteVersion: twoMinuteVersion.trim() || undefined,
      linkedDeckId: selectedDeckId || undefined,
      deckDailyTarget: selectedDeckId ? deckDailyTarget : undefined,
      autoCheckInOnReview: selectedDeckId ? autoCheckInOnReview : undefined
    });

    // Reset form
    setTitle('');
    setIdentityPrompt('');
    setTwoMinuteVersion('');
    setSelectedDeckId('');
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
        {/* Liên kết Bộ Thẻ Flashcard (Tùy chọn) */}
        <div className="rounded-2xl border border-border/80 bg-canvas-subtle/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Layers className="w-3.5 h-3.5 text-accent-sage" />
              <span>Liên kết Bộ Thẻ Flashcard (Tùy chọn)</span>
            </div>
            {selectedDeckId && (
              <button
                type="button"
                onClick={() => {
                  const deck = availableDecks.find((d) => d.id === selectedDeckId);
                  if (deck) applyDeckAutofill(deck);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                title="Tự động điền lại tên và bản sắc theo bộ thẻ này"
              >
                <Sparkles className="w-3 h-3 text-accent-sprout" />
                <span>Gợi ý lại</span>
              </button>
            )}
          </div>

          {availableDecks.length > 0 ? (
            <div className="space-y-2.5">
              <select
                value={selectedDeckId}
                onChange={(e) => handleDeckChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2 text-xs font-medium text-text-primary focus:border-accent-sprout focus:outline-none focus:ring-2 focus:ring-accent-sprout/20 transition-all cursor-pointer"
              >
                <option value="">-- Không liên kết bộ thẻ --</option>
                {availableDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    📖 {deck.title} ({deck.cardCount} thẻ)
                  </option>
                ))}
              </select>

              {/* Tùy chọn mục tiêu khi đã chọn bộ thẻ */}
              {selectedDeckId && (
                <div className="pt-1.5 border-t border-border/60 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-text-secondary font-medium">Mục tiêu vi mô mỗi ngày:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { count: 5, label: '5 thẻ (2p)' },
                        { count: 10, label: '10 thẻ' },
                        { count: 0, label: 'Hết thẻ đến hạn' }
                      ].map((tgt) => (
                        <button
                          key={tgt.count}
                          type="button"
                          onClick={() => setDeckDailyTarget(tgt.count)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                            deckDailyTarget === tgt.count
                              ? 'bg-primary text-white border-primary shadow-2xs'
                              : 'bg-canvas text-text-secondary border-border hover:bg-surface'
                          }`}
                        >
                          {tgt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={autoCheckInOnReview}
                      onChange={(e) => setAutoCheckInOnReview(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-accent-sprout h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                    <span className="text-[11px] text-text-secondary">
                      Tự động hoàn thành thói quen hôm nay khi học xong phiên ôn
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-text-tertiary py-1">
              <span>Chưa có bộ thẻ Flashcard nào trong máy</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTab('anki-decoder');
                }}
                className="text-primary font-semibold hover:underline cursor-pointer text-[11px]"
              >
                Nạp tệp .apkg ngay
              </button>
            </div>
          )}
        </div>

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
