import React, { useState, useEffect, useCallback } from 'react';
import { AnkiDeck } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { AnkiImportModal } from './AnkiImportModal';
import { ZenFlashcardViewer } from './ZenFlashcardViewer';
import { DriveSyncModal } from './DriveSyncModal';
import {
  Layers,
  Plus,
  Play,
  Trash2,
  Sparkles,
  BookOpen,
  Cloud
} from 'lucide-react';

interface FlashcardsTabProps {
  onSessionCompleted?: () => void;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({ onSessionCompleted }) => {
  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal quản lý
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [activeReviewDeckId, setActiveReviewDeckId] = useState<string | null>(null);

  // Tải danh sách bộ thẻ từ IndexedDB
  const loadDecks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDecks = await indexedDbService.getAllDecks();
      setDecks(fetchedDecks);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bộ thẻ:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const handleDeleteDeck = async (deckId: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ thẻ "${title}" và toàn bộ tệp âm thanh đi kèm?`)) {
      try {
        await indexedDbService.deleteDeck(deckId);
        await loadDecks();
      } catch (err) {
        console.error('Lỗi khi xóa deck:', err);
      }
    }
  };

  const handleImportSuccess = (deckId: string) => {
    loadDecks();
    // Tự động mở viewer để người dùng ôn ngay 2 phút nếu muốn
    setActiveReviewDeckId(deckId);
  };

  return (
    <div className="space-y-6">
      {/* Header Tab */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div>
          <h2 className="font-serif text-xl font-bold text-text-primary">
            Góc Ôn Tập Vi Mô
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Xây dựng tri thức bền vững với các phiên học 2 phút mỗi ngày
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-2xs"
            title="Sao lưu và đồng bộ với Google Drive cá nhân"
          >
            <Cloud className="w-3.5 h-3.5 text-accent-sage" />
            <span className="hidden sm:inline">Google Drive</span>
            <span className="sm:hidden">Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nhập Bộ Thẻ (.apkg)</span>
          </button>
        </div>
      </div>

      {/* Danh sách Bộ Thẻ hoặc Clean Empty State */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-text-tertiary">
          Đang nạp dữ liệu bộ thẻ...
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 sm:p-10 text-center space-y-3 shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-sprout text-primary mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Chưa có bộ thẻ Flashcard nào
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
              Bạn có thể nhập trực tiếp các tệp <span className="font-mono font-semibold text-primary">.apkg</span> từ Anki (từ vựng, thuật ngữ, động từ bất quy tắc) để ôn tập 2 phút mỗi ngày.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nhập bộ thẻ Anki đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-sprout text-primary shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-text-primary truncate" title={deck.title}>
                      {deck.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDeck(deck.id, deck.title)}
                    className="p-1 text-text-tertiary hover:text-accent-clay hover:bg-accent-clay/10 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Xóa bộ thẻ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-text-tertiary pt-1">
                  <span>
                    Quy mô: <strong className="text-text-primary">{deck.cardCount} thẻ</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-accent-sage font-medium">
                    <Sparkles className="w-3 h-3" />
                    <span>Quy tắc 2 phút</span>
                  </span>
                </div>
              </div>

              {/* Nút Ôn Tập 2 Phút */}
              <button
                type="button"
                onClick={() => setActiveReviewDeckId(deck.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-canvas border border-border py-2.5 px-4 text-xs font-semibold text-text-primary hover:bg-accent-sprout/60 hover:text-primary hover:border-accent-sage/40 active:scale-98 transition-all cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-primary text-primary" />
                <span>Ôn Tập Ngay (10 Thẻ)</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nhập Thẻ */}
      <AnkiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Trình Lật Thẻ Zen */}
      {activeReviewDeckId && (
        <ZenFlashcardViewer
          deckId={activeReviewDeckId}
          isOpen={!!activeReviewDeckId}
          onClose={() => setActiveReviewDeckId(null)}
          onCompleteSession={() => {
            onSessionCompleted?.();
          }}
        />
      )}

      {/* Modal Đồng Bộ Google Drive */}
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onDeckRestored={(deckId) => {
          loadDecks();
          setActiveReviewDeckId(deckId);
        }}
      />
    </div>
  );
};
