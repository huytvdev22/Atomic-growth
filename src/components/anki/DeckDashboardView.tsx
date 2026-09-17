import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnkiDeck, AnkiCard, MemoryVitality, calculateCardVitality } from '../../types/anki';
import { indexedDbService } from '../../services/indexedDbService';
import { ankiFirestoreSync } from '../../services/ankiFirestoreSync';
import { useAuth } from '../../context/AuthContext';
import {
  calculateDeckVitalityCounts,
  generateFutureDueForecast,
  getDeckReviewHistory,
  calculateDeckStreak,
  generateDeckHeatmapCells
} from '../../utils/deckAnalytics';
import { MemoryStrengthIndicator } from './MemoryStrengthIndicator';
import { WordDetailSheet } from './WordDetailSheet';
import { DeckThemesView, ThemeGroup } from './DeckThemesView';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Play,
  Flame,
  Sprout,
  TreeDeciduous,
  Calendar,
  Search,
  Volume2,
  RefreshCw,
  XCircle,
  TrendingUp,
  Cloud,
  CheckCircle2,
  Layers,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DeckDashboardViewProps {
  deckId: string;
  onBack: () => void;
  onStartReview: (deckId: string, targetCardIds?: string[], customSubtitle?: string) => void;
}

/**
 * Hàm loại bỏ HTML để lấy text thuần cho danh sách từ
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
 * Màn hình Dashboard Bảng Điều Khiển Bộ Thẻ Anki (DeckDashboardView)
 * Trực quan hóa toàn diện sức sống của bộ thẻ theo phong cách Botanical Zen & Atomic Habits:
 * - Khối Hôm nay (Today Action Hero) với Quy tắc 2 phút
 * - Tháp sinh trưởng & Tỉ lệ làm chủ (Card Counts & Vitality Bar lấy cảm hứng từ Anki Stats)
 * - Biểu đồ dự báo đến hạn (Future Due Forecast) 14 ngày tới
 * - Mini Garden Heatmap của riêng bộ thẻ (Phong cách Sáng Botanical Zen)
 * - Trạm khởi động phiên ôn linh hoạt (Study Launchpad)
 * - Kho từ vựng & Bài học (Words Explorer & Mural Themes) tích hợp
 * - Cử chỉ vuốt mép màn hình (Edge Swipe Back) như ứng dụng iOS Native
 */
export const DeckDashboardView: React.FC<DeckDashboardViewProps> = ({
  deckId,
  onBack,
  onStartReview
}) => {
  const { user } = useAuth();

  const [deck, setDeck] = useState<AnkiDeck | null>(null);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quản lý tab danh sách từ vựng vs chủ đề bài học
  const [explorerTab, setExplorerTab] = useState<'words' | 'themes'>('words');
  const [searchQuery, setSearchQuery] = useState('');
  const [vitalityFilter, setVitalityFilter] = useState<'all' | MemoryVitality>('all');
  const [selectedTheme, setSelectedTheme] = useState<ThemeGroup | null>(null);
  const [selectedCard, setSelectedCard] = useState<AnkiCard | null>(null);

  // Audio đang phát
  const [playingAudioCardId, setPlayingAudioCardId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cử chỉ vuốt mép màn hình (Edge Swipe Back) chuẩn iOS Native
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Nạp dữ liệu bộ thẻ và danh sách thẻ từ IndexedDB
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
      console.error('Lỗi khi nạp dữ liệu Deck Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deckId, user?.uid]);

  useEffect(() => {
    loadDeckData();
  }, [loadDeckData]);

  // Dọn dẹp audio khi unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Xử lý cử chỉ vuốt mép màn hình từ cạnh trái (iOS Native Edge Swipe to Back)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Chỉ kích hoạt khi điểm bắt đầu chạm nằm sát mép trái (< 40px từ cạnh trái)
    if (touch.clientX <= 40) {
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
    } else {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = Math.abs(touch.clientY - touchStartYRef.current);

    // Nếu vuốt sang phải tối thiểu 70px và không bị lệch dọc quá nhiều (deltaY < 80px)
    if (deltaX > 70 && deltaY < 80) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      onBack();
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Tính toán số liệu phân tích chuyên sâu
  const vitalityCounts = useMemo(() => calculateDeckVitalityCounts(cards), [cards]);
  const futureDue = useMemo(() => generateFutureDueForecast(cards, 14), [cards]);
  const reviewHistory = useMemo(() => getDeckReviewHistory(deckId), [deckId]);
  const deckStreak = useMemo(() => calculateDeckStreak(reviewHistory), [reviewHistory]);
  const heatmapCells = useMemo(() => generateDeckHeatmapCells(reviewHistory, 28), [reviewHistory]);

  // Kiểm tra xem hôm nay người dùng đã ôn tập bộ thẻ này chưa
  const todayStr = new Date().toISOString().split('T')[0];
  const studiedTodayCount = reviewHistory[todayStr] || 0;

  // Lọc danh sách từ theo tìm kiếm và bộ lọc cấp độ
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const themeSet = selectedTheme ? new Set(selectedTheme.cardIds) : null;

    return cards.filter((card) => {
      if (themeSet && !themeSet.has(card.id)) {
        return false;
      }
      const vitality = calculateCardVitality(card);
      if (vitalityFilter !== 'all' && vitality !== vitalityFilter) {
        return false;
      }
      if (!q) return true;
      const plainFront = stripHtml(card.front).toLowerCase();
      const plainBack = stripHtml(card.back).toLowerCase();
      return plainFront.includes(q) || plainBack.includes(q);
    });
  }, [cards, searchQuery, vitalityFilter, selectedTheme]);

  // Phát âm thanh hoặc dùng Text-to-Speech (TTS)
  const playCardAudioOrTts = async (card: AnkiCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 1. Ưu tiên phát file âm thanh gốc từ IndexedDB
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

    // 2. Dự phòng: Text-to-Speech (TTS) của trình duyệt
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
          Đang nạp dữ liệu phân tích bộ thẻ...
        </p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-text-secondary">Không tìm thấy thông tin bộ thẻ này.</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-6 w-full max-w-full overflow-hidden pb-12 animate-in fade-in duration-200 select-none sm:select-auto"
    >
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-canvas-subtle transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách bộ thẻ (Có thể vuốt từ mép trái sang phải trên điện thoại)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
                {deck.title}
              </h2>
              {deck.driveFileId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-sprout/60 text-primary text-[10px] font-semibold shrink-0">
                  <Cloud className="w-3 h-3" />
                  <span className="hidden sm:inline">Drive</span>
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{deck.cardCount} thẻ vựng</span>
              <span>•</span>
              <span>
                {deck.lastReviewedAt
                  ? `Ôn lần gần nhất: ${new Date(deck.lastReviewedAt).toLocaleDateString('vi-VN')}`
                  : 'Chưa bắt đầu ôn'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. KHỐI TRẠM HÀNH ĐỘNG HÔM NAY (TODAY ACTION HERO) */}
      <div className="rounded-2xl border border-accent-sprout/30 bg-surface p-5 sm:p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-accent-sprout/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-sprout/20 text-primary text-[11px] font-bold tracking-wide uppercase">
                <Sparkles className="w-3 h-3" />
                <span>Quy Tắc 2 Phút Mỗi Ngày</span>
              </span>
              {studiedTodayCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-semantic-green-bg text-semantic-green text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hôm nay đã ôn {studiedTodayCount} thẻ</span>
                </span>
              )}
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-text-primary">
              {futureDue.dueToday > 0 ? (
                <>
                  Hôm nay có{' '}
                  <span className="text-primary font-mono">{futureDue.dueToday} thẻ</span> đang chờ bạn
                  tưới nước
                </>
              ) : (
                'Khu vườn từ vựng hôm nay đã được chăm sóc đầy đủ!'
              )}
            </h3>

            <p className="text-xs text-text-secondary max-w-lg leading-relaxed">
              {futureDue.dueToday > 0
                ? 'Chỉ mất chưa đầy 2 phút để ngấm sâu các từ vựng này vào trí nhớ dài hạn. Không dồn ép, không áp lực.'
                : 'Bạn có thể chọn ôn tập các từ mong manh (Fragile) hoặc gieo thêm các hạt mầm từ mới bên dưới.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => onStartReview(deckId)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {futureDue.dueToday > 0 ? 'Bắt Đầu Phiên 2 Phút' : 'Ôn Thêm 10 Thẻ'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. KHỐI THÁP SINH TRƯỞNG & CARD COUNTS (LẤY CẢM HỨNG TỪ ANKI STATS) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-sprout/60 text-primary">
              <TreeDeciduous className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-bold text-text-primary">
              Sức Sống Bộ Thẻ (Card Counts & Vitality)
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-text-tertiary block">Tỷ lệ làm chủ</span>
            <span className="font-mono text-sm font-bold text-primary">
              {vitalityCounts.masteryRate}% vững chắc
            </span>
          </div>
        </div>

        {/* Thanh phân đoạn ngang 4 màu Botanical Zen (Segmented Vitality Bar) */}
        <div className="h-3 w-full rounded-full bg-canvas overflow-hidden flex shadow-2xs">
          {vitalityCounts.newPct > 0 && (
            <div
              className="h-full bg-[#8ECBA2] transition-all duration-300"
              style={{ width: `${vitalityCounts.newPct}%` }}
              title={`Hạt mầm mới: ${vitalityCounts.newCount} (${vitalityCounts.newPct}%)`}
            />
          )}
          {vitalityCounts.fragilePct > 0 && (
            <div
              className="h-full bg-accent-clay transition-all duration-300"
              style={{ width: `${vitalityCounts.fragilePct}%` }}
              title={`Mầm mong manh: ${vitalityCounts.fragileCount} (${vitalityCounts.fragilePct}%)`}
            />
          )}
          {vitalityCounts.growingPct > 0 && (
            <div
              className="h-full bg-accent-sage transition-all duration-300"
              style={{ width: `${vitalityCounts.growingPct}%` }}
              title={`Đang sinh trưởng: ${vitalityCounts.growingCount} (${vitalityCounts.growingPct}%)`}
            />
          )}
          {vitalityCounts.steadyPct > 0 && (
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${vitalityCounts.steadyPct}%` }}
              title={`Vững chắc: ${vitalityCounts.steadyCount} (${vitalityCounts.steadyPct}%)`}
            />
          )}
        </div>

        {/* Bảng 4 trạng thái sinh trưởng */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Hạt mầm mới */}
          <div className="rounded-xl border border-border-subtle bg-canvas/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-[#8ECBA2]" />
              <span>Hạt mầm mới</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base sm:text-lg font-bold text-text-primary">
                {vitalityCounts.newCount}
              </span>
              <span className="text-[11px] text-text-tertiary">
                {vitalityCounts.newPct}%
              </span>
            </div>
          </div>

          {/* Mầm mong manh */}
          <div className="rounded-xl border border-accent-clay/20 bg-accent-clay/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-accent-clay font-medium">
              <span className="w-2 h-2 rounded-full bg-accent-clay" />
              <span>Cần cấp cứu</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base sm:text-lg font-bold text-accent-clay">
                {vitalityCounts.fragileCount}
              </span>
              <span className="text-[11px] text-accent-clay/80">
                {vitalityCounts.fragilePct}%
              </span>
            </div>
          </div>

          {/* Đang sinh trưởng */}
          <div className="rounded-xl border border-accent-sage/20 bg-accent-sprout/10 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-accent-sage font-medium">
              <span className="w-2 h-2 rounded-full bg-accent-sage" />
              <span>Đang bén rễ</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base sm:text-lg font-bold text-accent-sage">
                {vitalityCounts.growingCount}
              </span>
              <span className="text-[11px] text-accent-sage/80">
                {vitalityCounts.growingPct}%
              </span>
            </div>
          </div>

          {/* Rễ sâu vững chắc */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Vững chắc</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base sm:text-lg font-bold text-primary">
                {vitalityCounts.steadyCount}
              </span>
              <span className="text-[11px] text-primary/80">
                {vitalityCounts.steadyPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. HAI CỘT: DỰ BÁO ĐẾN HẠN (FUTURE DUE) & MINI GARDEN HEATMAP SÁNG */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Khối A: Biểu đồ dự báo đến hạn (Future Due Forecast) */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-sprout/60 text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  Dự Báo Đến Hạn (Future Due)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">14 ngày tới</span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Số thẻ sẽ đến hạn lặp lại theo nhịp Spaced Repetition để bạn chủ động thời gian.
            </p>
          </div>

          {/* Biểu đồ cột mini HTML/CSS tinh gọn */}
          <div className="pt-4">
            <div className="flex items-end gap-1.5 h-28 w-full border-b border-border-subtle pb-1">
              {futureDue.items.map((item) => {
                const maxVal = Math.max(futureDue.peakDayCount, 5);
                const heightPercent = Math.max(6, Math.round((item.dueCount / maxVal) * 100));

                return (
                  <div
                    key={item.dateStr}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip khi hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-text-primary text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-xs pointer-events-none whitespace-nowrap z-10">
                      {item.dayLabel}: {item.dueCount} thẻ
                    </div>

                    {/* Cột hiển thị */}
                    <div
                      className={cn(
                        'w-full rounded-t-sm transition-all duration-300',
                        item.isToday
                          ? 'bg-primary'
                          : item.dueCount > 0
                          ? 'bg-accent-sprout hover:bg-accent-sprout-light'
                          : 'bg-canvas-subtle'
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Nhãn chân biểu đồ */}
            <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary pt-1.5">
              <span>Hôm nay ({futureDue.dueToday})</span>
              <span>Ngày mai ({futureDue.dueTomorrow})</span>
              <span>14 ngày tới</span>
            </div>
          </div>

          {/* Tóm tắt chỉ số */}
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
            <span>
              TB: <strong className="text-text-primary">{futureDue.averagePerDay} thẻ/ngày</strong>
            </span>
            <span>
              Tổng dự báo:{' '}
              <strong className="text-primary">{futureDue.totalForecastReviews} thẻ</strong>
            </span>
          </div>
        </div>

        {/* Khối B: Mini Garden Heatmap (PHONG CÁCH SÁNG BOTANICAL ZEN) */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-sprout/60 text-primary">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-bold text-text-primary">
                  Ma Trận Kiên Trì (28 Ngày)
                </h3>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-amber/15 text-[#8A6D3B] text-xs font-mono font-bold">
                <Flame className="w-3.5 h-3.5 text-accent-amber fill-accent-amber" />
                <span>{deckStreak} ngày</span>
              </div>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Mỗi ngày hoàn thành phiên 2 phút, một hạt mầm xanh tươi sẽ đơm chồi trong khu vườn.
            </p>
          </div>

          {/* Lưới ô vuông Heatmap (Phong cách Sáng Botanical Zen) */}
          <div className="py-2">
            <div className="grid grid-cols-7 gap-1.5 w-full">
              {heatmapCells.map((cell) => {
                // Sắc độ màu xanh sáng Botanical Zen
                let bgClass = 'bg-[#EFF1ED] border-border-subtle'; // Level 0: Xám ấm lanh nhạt
                if (cell.level === 1) bgClass = 'bg-[#EAF7E6] border-[#D4EED0]';
                if (cell.level === 2) bgClass = 'bg-[#A8DF98] border-[#8ECBA2]';
                if (cell.level === 3) bgClass = 'bg-[#6DC85A] border-[#528B70]';
                if (cell.level === 4) bgClass = 'bg-primary border-primary';

                return (
                  <div
                    key={cell.dateStr}
                    title={`${cell.dateStr}: ${cell.count} thẻ đã ôn`}
                    className={cn(
                      'aspect-square rounded-md border transition-all hover:scale-110 cursor-pointer shadow-2xs',
                      bgClass
                    )}
                  />
                );
              })}
            </div>

            {/* Chú giải cấp độ màu sáng */}
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-text-tertiary pt-3">
              <span>Ít</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EFF1ED] border border-border-subtle inline-block" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EAF7E6] border border-[#D4EED0] inline-block" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#A8DF98] inline-block" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#6DC85A] inline-block" />
              <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
              <span>Nhiều</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
            <span>Đã học hôm nay:</span>
            <strong className="font-mono text-primary">{studiedTodayCount} thẻ</strong>
          </div>
        </div>
      </div>

      {/* 5. KHỐI TRẠM KHỞI ĐỘNG PHIÊN HỌC (STUDY LAUNCHPAD) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-sprout/60 text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-base font-bold text-text-primary">
            Các Chế Độ Ôn Tập Linh Hoạt
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Chế độ 1: Phiên 2 phút chuẩn */}
          <button
            type="button"
            onClick={() => onStartReview(deckId)}
            className="flex flex-col justify-between p-4 rounded-xl border border-border bg-canvas hover:border-primary/50 hover:bg-surface transition-all text-left group cursor-pointer shadow-2xs"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <Play className="w-3.5 h-3.5 fill-primary" />
                  <span>Phiên 2 Phút</span>
                </span>
                <span className="font-mono text-xs text-text-tertiary">10 thẻ</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Ôn các thẻ đến hạn hôm nay theo quy tắc vi mô không trì hoãn.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-primary pt-3 group-hover:translate-x-0.5 transition-transform">
              <span>Bắt đầu</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </button>

          {/* Chế độ 2: Cấp cứu từ Fragile */}
          <button
            type="button"
            disabled={vitalityCounts.fragileCount === 0}
            onClick={() => {
              const fragileCards = cards.filter((c) => calculateCardVitality(c) === 'fragile');
              const targetIds = fragileCards.slice(0, 10).map((c) => c.id);
              onStartReview(deckId, targetIds, 'Cấp cứu từ Fragile');
            }}
            className={cn(
              'flex flex-col justify-between p-4 rounded-xl border transition-all text-left group shadow-2xs',
              vitalityCounts.fragileCount > 0
                ? 'border-accent-clay/30 bg-accent-clay/5 hover:border-accent-clay hover:bg-surface cursor-pointer'
                : 'border-border-subtle bg-canvas/40 opacity-60 cursor-not-allowed'
            )}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-clay">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Cứu Thẻ Fragile</span>
                </span>
                <span className="font-mono text-xs font-bold text-accent-clay">
                  {vitalityCounts.fragileCount} thẻ
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Tập trung củng cố các từ bị quên nhiều lần để tránh rụng trí nhớ.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-accent-clay pt-3 group-hover:translate-x-0.5 transition-transform">
              <span>{vitalityCounts.fragileCount > 0 ? 'Cấp cứu ngay' : 'Không có từ yếu'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </button>

          {/* Chế độ 3: Gieo mầm từ mới */}
          <button
            type="button"
            disabled={vitalityCounts.newCount === 0}
            onClick={() => {
              const newCards = cards.filter((c) => c.reps === 0 || c.state === 'new');
              const targetIds = newCards.slice(0, 10).map((c) => c.id);
              onStartReview(deckId, targetIds, 'Gieo mầm từ mới');
            }}
            className={cn(
              'flex flex-col justify-between p-4 rounded-xl border transition-all text-left group shadow-2xs',
              vitalityCounts.newCount > 0
                ? 'border-accent-sage/30 bg-accent-sprout/10 hover:border-accent-sage hover:bg-surface cursor-pointer'
                : 'border-border-subtle bg-canvas/40 opacity-60 cursor-not-allowed'
            )}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-sage">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Gieo Mầm Mới</span>
                </span>
                <span className="font-mono text-xs font-bold text-accent-sage">
                  {vitalityCounts.newCount} thẻ
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Làm quen với 10 từ vựng hoàn toàn mới chưa từng học trong bộ thẻ.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-accent-sage pt-3 group-hover:translate-x-0.5 transition-transform">
              <span>{vitalityCounts.newCount > 0 ? 'Khám phá ngay' : 'Đã học hết từ mới'}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </button>

          {/* Chế độ 4: Học theo bài học (Mural Themes) */}
          <button
            type="button"
            onClick={() => {
              setExplorerTab('themes');
              // Cuộn nhẹ xuống kho từ vựng
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="flex flex-col justify-between p-4 rounded-xl border border-border bg-canvas hover:border-primary/50 hover:bg-surface transition-all text-left group cursor-pointer shadow-2xs"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-text-primary">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Học Theo Bài</span>
                </span>
                <span className="font-mono text-xs text-text-tertiary">Mural</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Khám phá phân nhóm bài học (01. Contract, 02. Marketing...).
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-text-primary pt-3 group-hover:translate-x-0.5 transition-transform">
              <span>Xem bài học</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </div>
          </button>
        </div>
      </div>

      {/* 6. KHỐI KHO TỪ VỰNG & BÀI HỌC TÍCH HỢP (WORDS EXPLORER & THEMES) */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
        {/* Header kho từ & Nút chuyển đổi Tab */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border-subtle">
          <div>
            <h3 className="font-serif text-lg font-bold text-text-primary">
              Kho Tri Thức Của Bộ Thẻ
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Tra cứu nhanh, nghe phát âm và thực hành đặt câu cho từng từ vựng
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-canvas rounded-xl border border-border-subtle self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setExplorerTab('words')}
              className={cn(
                'flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                explorerTab === 'words'
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh Sách Từ ({cards.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setExplorerTab('themes')}
              className={cn(
                'flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                explorerTab === 'themes'
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Chủ Đề & Bài Học</span>
            </button>
          </div>
        </div>

        {explorerTab === 'themes' ? (
          /* Chế độ xem chủ đề phân nhóm (DeckThemesView) */
          <div className="pt-2">
            <DeckThemesView
              cards={cards}
              onSelectTheme={(theme) => {
                setSelectedTheme(theme);
                setExplorerTab('words');
              }}
              onReviewTheme={(theme) => {
                onStartReview(deckId, theme.cardIds, `Ôn nhóm: ${theme.title}`);
              }}
            />
          </div>
        ) : (
          /* Chế độ xem danh sách từ vựng thông thường */
          <div className="space-y-3 pt-1">
            {/* Thanh tìm kiếm & bộ lọc */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm từ vựng hoặc giải nghĩa..."
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

              {/* Bộ lọc theo cấp độ ghi nhớ */}
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
                  <span>Tất cả ({cards.length})</span>
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
                  <span>Fragile ({vitalityCounts.fragileCount})</span>
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
                  <span>Growing ({vitalityCounts.growingCount})</span>
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
                  <span>Steady ({vitalityCounts.steadyCount})</span>
                </button>
              </div>
            </div>

            {/* Thông báo nếu đang lọc theo theme */}
            {selectedTheme && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                <span>
                  Đang lọc theo chủ đề: <strong>{selectedTheme.title}</strong>
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

            {/* Danh sách các thẻ từ vựng */}
            <div className="divide-y divide-border-subtle/70 max-h-[420px] overflow-y-auto pr-1">
              {filteredCards.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary">
                  Không tìm thấy từ vựng nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                filteredCards.map((card) => {
                  const vitality = calculateCardVitality(card);
                  const frontText = stripHtml(card.front);
                  const backText = stripHtml(card.back);
                  const isPlaying = playingAudioCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-canvas-subtle/80 active:bg-canvas-muted transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-base font-bold text-text-primary tracking-tight truncate group-hover:text-primary transition-colors">
                            {frontText || '(Không có từ khóa)'}
                          </h4>

                          {/* Nút phát âm 1-tap (Audio gốc hoặc TTS Web Speech API) */}
                          <button
                            type="button"
                            onClick={(e) => playCardAudioOrTts(card, e)}
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

                        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                          {backText || '(Chưa có giải nghĩa)'}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <MemoryStrengthIndicator vitality={vitality} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

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
  );
};
