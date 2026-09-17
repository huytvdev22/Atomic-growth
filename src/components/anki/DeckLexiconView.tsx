import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnkiDeck, AnkiCard, MemoryVitality, calculateCardVitality } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { ankiFirestoreSync } from '../../services/ankiFirestoreSync';
import { useAuth } from '../../context/AuthContext';
import { MemoryStrengthIndicator } from './MemoryStrengthIndicator';
import { WordDetailSheet } from './WordDetailSheet';
import { DeckThemesView, ThemeGroup } from './DeckThemesView';
import {
  ArrowLeft,
  Search,
  Volume2,
  XCircle,
  LayoutGrid,
  List,
  BarChart3,
  Play,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { SwipeBackView } from '../common/SwipeBackView';

interface DeckLexiconViewProps {
  deckId: string;
  onBack: () => void;
  onOpenDashboard?: () => void;
  onStartReview: (deckId: string, targetCardIds?: string[], customSubtitle?: string) => void;
}

/**
 * Hàm loại bỏ HTML để lấy text thuần cho danh sách từ
 */
function stripHtml(html: string): string {
  if (!html) return '';
  if (!html.includes('<') && !html.includes('&')) {
    return html.trim();
  }
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[/]?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (match) => {
      switch (match) {
        case '&nbsp;': return ' ';
        case '&amp;': return '&';
        case '&lt;': return '<';
        case '&gt;': return '>';
        case '&quot;': return '"';
        case '&#39;': return "'";
        default: return '';
      }
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const PAGE_SIZE = 40;

interface LexiconCardItemProps {
  card: AnkiCard;
  viewMode: 'grid' | 'list';
  isPlaying: boolean;
  onSelect: (card: AnkiCard) => void;
  onPlayAudio: (card: AnkiCard, e: React.MouseEvent) => void;
}

/**
 * Component thẻ đơn lẻ trong danh sách:
 * Chỉ hiển thị trường được người dùng đánh dấu là "Chính" (primaryFront).
 * Các trường phụ trợ khác sẽ được xem khi nhấn vào chi tiết thẻ.
 */
const LexiconCardItem: React.FC<LexiconCardItemProps> = React.memo(({
  card,
  viewMode,
  isPlaying,
  onSelect,
  onPlayAudio
}) => {
  const vitality = useMemo(() => calculateCardVitality(card), [card]);
  // Chỉ lấy trường "Chính" để hiển thị trong danh sách
  const primaryText = useMemo(() => {
    if (card.primaryFront) return card.primaryFront;
    return stripHtml(card.front);
  }, [card.primaryFront, card.front]);
  const backText = useMemo(() => stripHtml(card.back), [card.back]);

  if (viewMode === 'grid') {
    return (
      <div
        onClick={() => onSelect(card)}
        className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4 flex flex-col justify-between space-y-2.5 hover:border-primary/50 hover:shadow-xs active:scale-98 transition-all cursor-pointer group shadow-2xs relative"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Tiêu đề chính (Trường được đánh dấu "Chính") */}
            <h4 className="font-serif text-base font-bold text-text-primary tracking-tight truncate group-hover:text-primary transition-colors">
              {primaryText || '(Không có tiêu đề)'}
            </h4>
          </div>

          <button
            type="button"
            onClick={(e) => onPlayAudio(card, e)}
            className={cn(
              'inline-flex items-center justify-center rounded-full p-1.5 transition-all cursor-pointer shrink-0',
              isPlaying
                ? 'bg-primary text-white scale-105 shadow-2xs'
                : 'text-primary/70 hover:bg-accent-sprout/60 hover:text-primary active:scale-95'
            )}
            title="Nghe phát âm"
          >
            <Volume2 className={cn('w-3.5 h-3.5', isPlaying && 'animate-pulse')} />
          </button>
        </div>

        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed flex-1">
          {backText || '(Chưa có giải nghĩa)'}
        </p>

        <div className="pt-2 border-t border-border-subtle/70 flex items-center justify-between text-[11px]">
          <MemoryStrengthIndicator vitality={vitality} showLabel={false} />
          <span className="text-text-tertiary font-mono text-[10px]">
            {card.reps > 0 ? `${card.reps} lần ôn` : 'Chưa học'}
          </span>
        </div>
      </div>
    );
  }

  // Dạng danh sách phẳng (List) - Tinh gọn, chỉ có trường Chính và nghĩa tóm tắt
  return (
    <div
      onClick={() => onSelect(card)}
      className="py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 hover:bg-canvas-subtle/80 active:bg-canvas-muted transition-all cursor-pointer group border-b border-border-subtle/60 last:border-b-0"
    >
      <div className="flex-1 min-w-0 pr-1 sm:pr-2">
        <div className="flex items-center gap-2">
          {/* Tiêu đề chính (Trường được đánh dấu "Chính") */}
          <h4 className="font-serif text-base sm:text-lg font-bold text-text-primary tracking-tight truncate group-hover:text-primary transition-colors">
            {primaryText || '(Không có tiêu đề)'}
          </h4>

          {/* Nút nghe phát âm */}
          <button
            type="button"
            onClick={(e) => onPlayAudio(card, e)}
            className={cn(
              'inline-flex items-center justify-center rounded-full p-1 transition-all cursor-pointer shrink-0',
              isPlaying
                ? 'bg-primary text-white scale-105 shadow-2xs'
                : 'text-primary/70 hover:bg-accent-sprout/60 hover:text-primary active:scale-95'
            )}
            title="Nghe phát âm"
          >
            <Volume2 className={cn('w-3.5 h-3.5', isPlaying && 'animate-pulse')} />
          </button>
        </div>

        {/* Nghĩa / Giải thích mặt sau */}
        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5 leading-normal">
          {backText || '(Chưa có giải nghĩa)'}
        </p>
      </div>

      {/* Chỉ báo sức sống 3 vạch tinh gọn */}
      <div className="shrink-0 flex items-center pl-1">
        <MemoryStrengthIndicator vitality={vitality} showLabel={false} />
      </div>
    </div>
  );
});
LexiconCardItem.displayName = 'LexiconCardItem';

/**
 * Màn hình Kho Tri Thức & Danh Sách Từ Vựng Chuyên Biệt (DeckLexiconView)
 * Tối ưu 100% không gian cho việc tra cứu, tìm kiếm, nghe audio và phân nhóm bài học
 */
export const DeckLexiconView: React.FC<DeckLexiconViewProps> = ({
  deckId,
  onBack,
  onOpenDashboard,
  onStartReview
}) => {
  const { user } = useAuth();
  const [deck, setDeck] = useState<AnkiDeck | null>(null);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab: Xem từ vựng vs Xem chủ đề bài học
  const [activeTab, setActiveTab] = useState<'words' | 'themes'>('words');
  // Chế độ xem từ: Mặc định Danh mục (list) tinh gọn trên mobile
  const [displayLayout, setDisplayLayout] = useState<'grid' | 'list'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [vitalityFilter, setVitalityFilter] = useState<'all' | MemoryVitality>('all');
  const [selectedTheme, setSelectedTheme] = useState<ThemeGroup | null>(null);
  const [selectedCard, setSelectedCard] = useState<AnkiCard | null>(null);

  // Phân trang / Lazy Chunking
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Audio đang phát
  const [playingAudioCardId, setPlayingAudioCardId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Nạp dữ liệu
  const loadDeckData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (user?.uid) {
        await ankiFirestoreSync.mergeFirestoreProgressToIndexedDb(user.uid, deckId);
      }
      const fetchedDeck = await indexedDbService.getDeckById(deckId);
      const fetchedCards = await indexedDbService.getCardsByDeckId(deckId);
      setDeck(fetchedDeck);
      setCards(fetchedCards);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu DeckLexiconView:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deckId, user?.uid]);

  useEffect(() => {
    loadDeckData();
  }, [loadDeckData]);

  // Reset phân trang khi đổi bộ lọc
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, vitalityFilter, selectedTheme, deckId]);

  // Dọn dẹp audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Đếm số lượng theo Vitality
  const vitalityCounts = useMemo(() => {
    let fragile = 0;
    let growing = 0;
    let steady = 0;
    cards.forEach((c) => {
      const v = calculateCardVitality(c);
      if (v === 'fragile') fragile++;
      else if (v === 'growing') growing++;
      else steady++;
    });
    return { fragile, growing, steady };
  }, [cards]);

  // Lọc thẻ
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const themeSet = selectedTheme ? new Set(selectedTheme.cardIds) : null;
    const hasVitalityFilter = vitalityFilter !== 'all';

    if (!q && !themeSet && !hasVitalityFilter) {
      return cards;
    }

    return cards.filter((card) => {
      if (themeSet && !themeSet.has(card.id)) return false;
      if (hasVitalityFilter) {
        const vitality = calculateCardVitality(card);
        if (vitality !== vitalityFilter) return false;
      }
      if (!q) return true;

      const rawFront = (card.front || '').toLowerCase();
      const rawBack = (card.back || '').toLowerCase();
      if (rawFront.includes(q) || rawBack.includes(q)) return true;

      const plainFront = stripHtml(card.front).toLowerCase();
      const plainBack = stripHtml(card.back).toLowerCase();
      return plainFront.includes(q) || plainBack.includes(q);
    });
  }, [cards, searchQuery, vitalityFilter, selectedTheme]);

  // Thẻ hiển thị theo phân đoạn
  const displayedCards = useMemo(() => {
    return filteredCards.slice(0, visibleCount);
  }, [filteredCards, visibleCount]);

  // Cuộn tự động nạp thêm
  const handleScrollCardsList = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (visibleCount < filteredCards.length) {
        setVisibleCount((prev) => Math.min(prev + 50, filteredCards.length));
      }
    }
  };

  // Phát âm thanh
  const playCardAudioOrTts = async (card: AnkiCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (card.audioName) {
      try {
        const blob = await indexedDbService.getMediaBlob(card.audioName);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
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
          return;
        }
      } catch (err) {
        console.warn('Lỗi phát âm thanh file:', err);
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const plainText = stripHtml(card.front);
      if (plainText) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        setPlayingAudioCardId(card.id);
        utterance.onend = () => setPlayingAudioCardId(null);
        utterance.onerror = () => setPlayingAudioCardId(null);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-text-secondary font-medium">
          Đang nạp kho từ vựng...
        </p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-text-secondary">Không tìm thấy thông tin bộ thẻ.</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại</span>
        </button>
      </div>
    );
  }

  return (
    <SwipeBackView onBack={onBack}>
      <div className="space-y-5 w-full max-w-full overflow-hidden pb-12 animate-in fade-in duration-200 select-none sm:select-auto">
        {/* 1. TOP HEADER APP BAR (1 HÀNG TINH GỌN TRÊN CẢ MOBILE LẪN DESKTOP) */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
        {/* Nút Back + Tên Deck + Số thẻ */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-canvas-subtle active:scale-95 transition-all cursor-pointer shrink-0"
            title="Quay lại danh sách bộ thẻ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1 flex items-baseline gap-2 truncate">
            <h2 className="font-serif text-base sm:text-xl font-bold text-text-primary tracking-tight truncate">
              {deck.title}
            </h2>
            <span className="text-[11px] font-mono text-text-tertiary shrink-0">
              ({cards.length} thẻ)
            </span>
          </div>
        </div>

        {/* Cụm nút thao tác nhanh: Xem thống kê & Ôn tập 2 phút */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold text-text-secondary hover:text-primary hover:bg-canvas-subtle transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Mở Bảng Điều Khiển Sức Sống Bộ Thẻ"
            >
              <BarChart3 className="w-3.5 h-3.5 text-accent-sage" />
              <span className="hidden sm:inline">Thống kê</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onStartReview(deckId)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Ôn tập nhanh 2 phút"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Ôn 2p</span>
          </button>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TÌM KIẾM & CHUYỂN ĐỔI CHẾ ĐỘ */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Ô tìm kiếm từ vựng */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ vựng hoặc giải nghĩa..."
              className="w-full rounded-xl bg-canvas border border-border pl-9 pr-8 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary/50 focus:bg-surface focus:outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cụm chuyển đổi Tab: Từ Vựng vs Bài Học */}
          <div className="flex items-center p-0.5 bg-canvas rounded-xl border border-border-subtle shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('words')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                activeTab === 'words'
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <span>Từ Vựng</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('themes')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                activeTab === 'themes'
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <span>Bài Học</span>
            </button>
          </div>

          {/* Toggle Grid vs List (trên desktop/tablet) */}
          {activeTab === 'words' && (
            <div className="hidden sm:flex items-center p-0.5 bg-canvas rounded-xl border border-border-subtle shrink-0">
              <button
                type="button"
                onClick={() => setDisplayLayout('grid')}
                className={cn(
                  'p-1 rounded-lg transition-all cursor-pointer',
                  displayLayout === 'grid'
                    ? 'bg-surface text-primary shadow-2xs'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
                title="Xem dạng lưới thẻ hạt mầm"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDisplayLayout('list')}
                className={cn(
                  'p-1 rounded-lg transition-all cursor-pointer',
                  displayLayout === 'list'
                    ? 'bg-surface text-primary shadow-2xs'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
                title="Xem dạng danh mục tinh gọn"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bộ lọc theo cấp độ ghi nhớ (mỏng nhẹ, cuộn ngang) */}
        {activeTab === 'words' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setVitalityFilter('all')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
                vitalityFilter === 'all'
                  ? 'bg-primary text-white shadow-2xs font-semibold'
                  : 'bg-canvas border border-border text-text-secondary hover:bg-canvas-subtle'
              )}
            >
              <span>Tất cả ({cards.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setVitalityFilter('fragile')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
                vitalityFilter === 'fragile'
                  ? 'bg-accent-clay text-white shadow-2xs font-semibold'
                  : 'bg-canvas border border-border text-text-secondary hover:border-accent-clay/40'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-clay" />
              <span>Fragile ({vitalityCounts.fragile})</span>
            </button>

            <button
              type="button"
              onClick={() => setVitalityFilter('growing')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
                vitalityFilter === 'growing'
                  ? 'bg-accent-sage text-white shadow-2xs font-semibold'
                  : 'bg-canvas border border-border text-text-secondary hover:border-accent-sage/40'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-sage" />
              <span>Growing ({vitalityCounts.growing})</span>
            </button>

            <button
              type="button"
              onClick={() => setVitalityFilter('steady')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer',
                vitalityFilter === 'steady'
                  ? 'bg-primary text-white shadow-2xs font-semibold'
                  : 'bg-canvas border border-border text-text-secondary hover:border-primary/40'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Steady ({vitalityCounts.steady})</span>
            </button>
          </div>
        )}

        {/* Thông báo nếu đang lọc theo theme */}
        {selectedTheme && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <span>
              Đang lọc theo bài học: <strong>{selectedTheme.title}</strong> ({selectedTheme.cardIds.length} từ)
            </span>
            <button
              type="button"
              onClick={() => setSelectedTheme(null)}
              className="underline hover:text-primary-dark cursor-pointer font-semibold text-[11px]"
            >
              Xem tất cả
            </button>
          </div>
        )}
      </div>

      {/* 3. KHU VỰC HIỂN THỊ NỘI DUNG */}
      {activeTab === 'themes' ? (
        /* Tab Chủ Đề & Bài Học */
        <DeckThemesView
          cards={cards}
          onSelectTheme={(theme) => {
            setSelectedTheme(theme);
            setActiveTab('words');
          }}
          onReviewTheme={(theme) => {
            onStartReview(deckId, theme.cardIds, `Ôn nhóm: ${theme.title}`);
          }}
        />
      ) : (
        /* Tab Danh Sách Từ Vựng */
        <div
          onScroll={handleScrollCardsList}
          className="space-y-4 max-h-[calc(100dvh-200px)] overflow-y-auto pr-1 scroll-smooth"
        >
          {filteredCards.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-tertiary">
              Không tìm thấy từ vựng nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <>
              {displayLayout === 'grid' ? (
                /* Lưới thẻ hạt mầm */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {displayedCards.map((card) => (
                    <LexiconCardItem
                      key={card.id}
                      card={card}
                      viewMode="grid"
                      isPlaying={playingAudioCardId === card.id}
                      onSelect={(c) => setSelectedCard(c)}
                      onPlayAudio={(c, e) => playCardAudioOrTts(c, e)}
                    />
                  ))}
                </div>
              ) : (
                /* Danh sách phẳng */
                <div className="rounded-2xl border border-border bg-surface divide-y divide-border-subtle/60 overflow-hidden shadow-2xs">
                  {displayedCards.map((card) => (
                    <LexiconCardItem
                      key={card.id}
                      card={card}
                      viewMode="list"
                      isPlaying={playingAudioCardId === card.id}
                      onSelect={(c) => setSelectedCard(c)}
                      onPlayAudio={(c, e) => playCardAudioOrTts(c, e)}
                    />
                  ))}
                </div>
              )}

              {/* Điều khiển tải thêm */}
              {visibleCount < filteredCards.length && (
                <div className="pt-3 pb-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 50, filteredCards.length))}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <span>Tải thêm 50 từ vựng</span>
                    <span className="font-mono text-[11px] opacity-75">
                      ({displayedCards.length}/{filteredCards.length})
                    </span>
                  </button>

                  {filteredCards.length <= 500 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(filteredCards.length)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-text-tertiary hover:text-text-primary text-xs font-medium transition-all cursor-pointer"
                    >
                      <span>Xem toàn bộ ({filteredCards.length} từ)</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Sheet Chi Tiết Từ Vựng & Đặt Câu */}
      <WordDetailSheet
        card={selectedCard}
        deckTitle={deck.title}
        isOpen={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onReviewSingle={(cardId) => {
          setSelectedCard(null);
          const singleCard = cards.find((c) => c.id === cardId);
          const singleTitle = singleCard ? stripHtml(singleCard.front).slice(0, 20) : '';
          onStartReview(deckId, [cardId], singleTitle ? `Ôn từ: ${singleTitle}` : 'Ôn 1 từ');
        }}
      />
      </div>
    </SwipeBackView>
  );
};
