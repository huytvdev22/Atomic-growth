import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnkiDeck, AnkiCard, MemoryVitality, calculateCardVitality } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { ankiFirestoreSync } from '../../services/ankiFirestoreSync';
import { useAuth } from '../../context/AuthContext';
import { BottomSheet } from '../BottomSheet';
import { MemoryStrengthIndicator } from './MemoryStrengthIndicator';
import {
  Search,
  Volume2,
  BookOpen,
  Play,
  RefreshCw,
  XCircle,
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DeckWordsModalProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
  onStartReview?: (deckId: string) => void;
}

/**
 * Hàm loại bỏ các thẻ HTML để lấy văn bản thuần khiết cho danh sách từ
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[/]?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Màn hình Duyệt Danh Sách Từ Trong Bộ Thẻ (Deck Words Explorer / Your Words)
 * Thiết kế theo phong cách Botanical Zen lấy cảm hứng từ ứng dụng Mural:
 * - Hiển thị danh sách từ vựng trực quan kèm giải nghĩa
 * - Thước đo mức độ ghi nhớ 3 vạch: Fragile (Mong manh) / Growing (Đang lớn) / Steady (Vững chắc)
 * - Tự động đồng bộ và hợp nhất tiến độ từ Cloud Firestore
 * - Hỗ trợ tìm kiếm nhanh và nghe phát âm 1-tap trực tiếp
 */
export const DeckWordsModal: React.FC<DeckWordsModalProps> = ({
  deckId,
  isOpen,
  onClose,
  onStartReview
}) => {
  const { user } = useAuth();

  const [deck, setDeck] = useState<AnkiDeck | null>(null);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vitalityFilter, setVitalityFilter] = useState<'all' | MemoryVitality>('all');

  // Quản lý audio đang phát
  const [playingAudioCardId, setPlayingAudioCardId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Nạp bộ thẻ và danh sách thẻ từ IndexedDB & Cloud Firestore
  useEffect(() => {
    if (!isOpen || !deckId) return;

    let isMounted = true;

    async function loadDeckAndWords() {
      setIsLoading(true);
      try {
        // 1. Tự động kéo tiến độ từ Firestore về hợp nhất vào IndexedDB nếu người dùng đã đăng nhập
        if (user?.uid) {
          await ankiFirestoreSync.mergeFirestoreProgressToIndexedDb(user.uid, deckId);
        }

        // 2. Nạp dữ liệu từ IndexedDB cục bộ
        const fetchedDeck = await indexedDbService.getDeckById(deckId);
        const fetchedCards = await indexedDbService.getCardsByDeckId(deckId);

        if (isMounted) {
          setDeck(fetchedDeck);
          setCards(fetchedCards);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách từ vựng:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDeckAndWords();

    return () => {
      isMounted = false;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [isOpen, deckId, user?.uid]);

  // Thống kê số lượng theo 3 cấp độ sinh trưởng
  const stats = useMemo(() => {
    let fragile = 0;
    let growing = 0;
    let steady = 0;

    cards.forEach((card) => {
      const v = calculateCardVitality(card);
      if (v === 'fragile') fragile++;
      else if (v === 'growing') growing++;
      else steady++;
    });

    return { fragile, growing, steady, total: cards.length };
  }, [cards]);

  // Danh sách từ sau khi lọc theo tìm kiếm và mức độ ghi nhớ
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return cards.filter((card) => {
      const vitality = calculateCardVitality(card);

      // Lọc theo cấp độ
      if (vitalityFilter !== 'all' && vitality !== vitalityFilter) {
        return false;
      }

      // Lọc theo chuỗi tìm kiếm
      if (!q) return true;

      const plainFront = stripHtml(card.front).toLowerCase();
      const plainBack = stripHtml(card.back).toLowerCase();
      return plainFront.includes(q) || plainBack.includes(q);
    });
  }, [cards, searchQuery, vitalityFilter]);

  // Phát âm thanh của một thẻ cụ thể
  const playCardAudio = async (card: AnkiCard, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.audioName) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      const blob = await indexedDbService.getMediaBlob(card.audioName);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setPlayingAudioCardId(card.id);

      audio.onended = () => {
        setPlayingAudioCardId(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingAudioCardId(null);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (err) {
      console.warn('Không thể phát âm thanh:', err);
      setPlayingAudioCardId(null);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      icon={<BookOpen className="h-4.5 w-4.5" />}
      title={deck?.title || 'Danh Sách Từ Vựng'}
      subtitle={cards.length > 0 ? `${cards.length} từ trong bộ thẻ` : 'Vườn từ vựng'}
      className="h-[92dvh] sm:h-[680px] sm:max-h-[85vh]"
      contentClassName="p-0 flex flex-col flex-1 overflow-hidden space-y-0"
    >
      {/* Vùng điều khiển & Lọc trên cùng (Search & Filter Section) */}
      <div className="px-5 pt-3 pb-3 border-b border-border-subtle bg-surface space-y-3 shrink-0">
        {/* Thanh tìm kiếm Find a word */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm từ vựng hoặc ý nghĩa..."
            className="w-full rounded-xl bg-canvas border border-border pl-10 pr-9 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary/50 focus:bg-surface focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Thanh đếm 3 cấp độ sinh trưởng & Bộ lọc Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setVitalityFilter('all')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
              vitalityFilter === 'all'
                ? 'bg-primary text-white shadow-2xs font-semibold'
                : 'bg-canvas border border-border text-text-secondary hover:bg-canvas-subtle'
            )}
          >
            <span>Tất cả</span>
            <span className="font-mono opacity-80">({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setVitalityFilter('fragile')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
              vitalityFilter === 'fragile'
                ? 'bg-accent-clay text-white shadow-2xs font-semibold'
                : 'bg-canvas border border-border text-text-secondary hover:border-accent-clay/40'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-accent-clay" />
            <span>Fragile (Mong manh)</span>
            <span className="font-mono font-bold text-accent-clay">
              {vitalityFilter === 'fragile' ? '' : `(${stats.fragile})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVitalityFilter('growing')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
              vitalityFilter === 'growing'
                ? 'bg-accent-sage text-white shadow-2xs font-semibold'
                : 'bg-canvas border border-border text-text-secondary hover:border-accent-sage/40'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-accent-sage" />
            <span>Growing (Đang lớn)</span>
            <span className="font-mono font-bold text-accent-sage">
              {vitalityFilter === 'growing' ? '' : `(${stats.growing})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVitalityFilter('steady')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
              vitalityFilter === 'steady'
                ? 'bg-primary text-white shadow-2xs font-semibold'
                : 'bg-canvas border border-border text-text-secondary hover:border-primary/40'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Steady (Vững chắc)</span>
            <span className="font-mono font-bold text-primary">
              {vitalityFilter === 'steady' ? '' : `(${stats.steady})`}
            </span>
          </button>
        </div>
      </div>

      {/* Danh sách từ vựng cuộn linh hoạt (Words List) */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/70 px-5 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-text-secondary font-medium">
              Đang nạp và đồng bộ danh sách từ...
            </p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas border border-border text-text-tertiary">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-xs font-serif font-semibold text-text-primary">
              Không tìm thấy từ vựng phù hợp
            </p>
            <p className="text-[11px] text-text-secondary max-w-xs">
              Thử tìm kiếm với từ khóa khác hoặc chuyển bộ lọc cấp độ sinh trưởng.
            </p>
          </div>
        ) : (
          filteredCards.map((card) => {
            const vitality = calculateCardVitality(card);
            const frontText = stripHtml(card.front);
            const backText = stripHtml(card.back);
            const hasAudio = !!card.audioName;
            const isPlaying = playingAudioCardId === card.id;

            return (
              <div
                key={card.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-canvas/50 transition-colors group"
              >
                {/* Thông tin từ vựng (Từ khóa & Nghĩa) */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base sm:text-lg font-bold text-text-primary tracking-tight truncate">
                      {frontText || '(Không có tiêu đề)'}
                    </h4>

                    {/* Nút nghe phát âm mini 1-tap nếu có tệp audio */}
                    {hasAudio && (
                      <button
                        type="button"
                        onClick={(e) => playCardAudio(card, e)}
                        className={cn(
                          'inline-flex items-center justify-center rounded-full p-1 transition-all cursor-pointer shrink-0',
                          isPlaying
                            ? 'bg-primary text-white scale-105 shadow-2xs'
                            : 'text-primary/70 hover:bg-accent-sprout/60 hover:text-primary active:scale-95'
                        )}
                        title="Nghe phát âm"
                      >
                        <Volume2
                          className={cn('w-3.5 h-3.5', isPlaying && 'animate-pulse')}
                        />
                      </button>
                    )}
                  </div>

                  {/* Nghĩa tóm tắt mặt sau */}
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mt-0.5 font-normal">
                    {backText || '(Chưa có giải nghĩa)'}
                  </p>
                </div>

                {/* Thước đo mức độ ghi nhớ 3 vạch (MemoryStrengthIndicator) */}
                <div className="shrink-0 pl-2">
                  <MemoryStrengthIndicator vitality={vitality} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hành động: Nút ôn tập nhanh (Quick Practice) */}
      <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface shrink-0 flex items-center justify-between gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-tertiary">
          <Info className="w-3.5 h-3.5 text-text-tertiary" />
          <span>Vạch biểu thị độ vững trí nhớ, không phải vĩnh viễn</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-canvas-subtle transition-all cursor-pointer"
          >
            Đóng
          </button>

          {onStartReview && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartReview(deckId);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Ôn tập 2 phút</span>
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
